"""LangGraph node functions for the AI agent."""

import re
from difflib import get_close_matches

from langchain_groq import ChatGroq
from app.ai.prompts import (
    ROUTER_PROMPT, QUERY_GEN_PROMPT, EXPLAIN_PROMPT,
    OPTIMIZE_PROMPT, FIX_PROMPT, EXPLORE_PROMPT,
)
from app.config import settings


def get_llm(temperature: float = 0.6) -> ChatGroq:
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name="openai/gpt-oss-120b",
        temperature=temperature,
    )


def clean_query_response(content: str) -> str:
    """Extract a query when the model wraps it in markdown."""
    query = content.strip()
    if query.startswith("```"):
        lines = query.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        query = "\n".join(lines).strip()
    return query


def schema_object_names(schema: str) -> list[str]:
    """Return table/collection names from the text schema context."""
    names: list[str] = []
    for line in schema.splitlines():
        match = re.match(r"^\s*(?:TABLE|COLLECTION)\s+(.+?):\s*$", line, re.IGNORECASE)
        if match:
            names.append(_strip_identifier(match.group(1)))
    return names


def validate_fixed_query(original_query: str, fixed_query: str, schema: str, db_type: str) -> str:
    """Keep AI fixes constrained to the actual schema tables/collections."""
    if db_type == "mongodb":
        return fixed_query

    known_tables = schema_object_names(schema)
    if not known_tables:
        return fixed_query

    table_lookup = {table.lower(): table for table in known_tables}
    fixed_tables = _extract_sql_tables(fixed_query)
    unknown_tables = [table for table in fixed_tables if table.lower() not in table_lookup]

    if not unknown_tables:
        return fixed_query

    original_schema_mentions = _schema_names_mentioned_in_query(original_query, known_tables)
    corrected = fixed_query
    for unknown in unknown_tables:
        replacement = _choose_table_replacement(unknown, original_schema_mentions, known_tables)
        if replacement:
            corrected = _replace_identifier(corrected, unknown, replacement)

    remaining_unknown = [
        table for table in _extract_sql_tables(corrected)
        if table.lower() not in table_lookup
    ]
    if remaining_unknown:
        return _basic_sql_syntax_fix(original_query)

    return corrected


def _strip_identifier(identifier: str) -> str:
    value = identifier.strip().split()[0]
    if "." in value:
        value = value.split(".")[-1]
    return value.strip('`"[]')


def _extract_sql_tables(query: str) -> list[str]:
    sql = _remove_string_literals(query)
    pattern = re.compile(
        r"\b(?:FROM|JOIN|UPDATE|INTO|TABLE)\s+([`\"\[]?[A-Za-z_][\w$]*(?:\.[A-Za-z_][\w$]*)?[`\"\]]?)",
        re.IGNORECASE,
    )
    seen: list[str] = []
    for match in pattern.finditer(sql):
        table = _strip_identifier(match.group(1))
        if table and table.lower() not in [item.lower() for item in seen]:
            seen.append(table)
    return seen


def _schema_names_mentioned_in_query(query: str, known_tables: list[str]) -> list[str]:
    tokens = {token.lower() for token in re.findall(r"[A-Za-z_][\w$]*", query)}
    return [table for table in known_tables if table.lower() in tokens]


def _choose_table_replacement(
    unknown: str,
    original_schema_mentions: list[str],
    known_tables: list[str],
) -> str | None:
    if len(original_schema_mentions) == 1:
        return original_schema_mentions[0]

    close = get_close_matches(unknown.lower(), [table.lower() for table in known_tables], n=1, cutoff=0.72)
    if close:
        return next(table for table in known_tables if table.lower() == close[0])

    return None


def _replace_identifier(query: str, old: str, new: str) -> str:
    return re.sub(
        rf"(?<![\w$])([`\"\[]?){re.escape(old)}([`\"\]]?)(?![\w$])",
        lambda match: f"{match.group(1)}{new}{match.group(2)}",
        query,
        flags=re.IGNORECASE,
    )


def _basic_sql_syntax_fix(query: str) -> str:
    replacements = {
        "selec": "select",
        "slct": "select",
        "selct": "select",
        "fom": "from",
        "form": "from",
        "wher": "where",
        "whre": "where",
        "oder": "order",
        "grop": "group",
        "gruop": "group",
        "limt": "limit",
    }
    fixed = query
    for wrong, right in replacements.items():
        fixed = re.sub(rf"\b{wrong}\b", right, fixed, flags=re.IGNORECASE)
    return fixed.strip()


def _remove_string_literals(query: str) -> str:
    return re.sub(r"'(?:''|[^'])*'|\"(?:\"\"|[^\"])*\"", "''", query)


def route_intent(state: dict) -> dict:
    """Classify user intent."""
    llm = get_llm()
    user_input = state["user_input"]
    response = llm.invoke([
        {"role": "system", "content": ROUTER_PROMPT},
        {"role": "user", "content": user_input},
    ])
    intent = response.content.strip().lower()
    # Normalize
    valid = {"query", "explain", "optimize", "fix", "explore"}
    if intent not in valid:
        intent = "query"  # default
    return {**state, "intent": intent}


def generate_query(state: dict) -> dict:
    """Generate a database query from natural language."""
    llm = get_llm()
    prompt = QUERY_GEN_PROMPT.format(
        db_type=state["db_type"],
        schema=state["schema"],
    )
    response = llm.invoke([
        {"role": "system", "content": prompt},
        {"role": "user", "content": state["user_input"]},
    ])
    query = clean_query_response(response.content)
    return {**state, "generated_query": query}


def explain_results(state: dict) -> dict:
    """Explain query results in plain English."""
    llm = get_llm()
    import json
    results_str = json.dumps(state.get("results_preview", [])[:20], indent=2, default=str)
    prompt = EXPLAIN_PROMPT.format(
        db_type=state["db_type"],
        query=state.get("query", ""),
        results=results_str,
    )
    response = llm.invoke([
        {"role": "system", "content": prompt},
        {"role": "user", "content": state.get("user_input", "Explain these results")},
    ])
    return {**state, "explanation": response.content.strip()}


def optimize_query(state: dict) -> dict:
    """Suggest query optimizations."""
    llm = get_llm()
    prompt = OPTIMIZE_PROMPT.format(
        db_type=state["db_type"],
        schema=state["schema"],
        query=state.get("query", ""),
    )
    response = llm.invoke([
        {"role": "system", "content": prompt},
        {"role": "user", "content": state.get("user_input", "Optimize this query")},
    ])
    return {**state, "optimization": response.content.strip()}


def fix_query(state: dict) -> dict:
    """Fix a broken query."""
    llm = get_llm(temperature=0.0)
    schema = state["schema"]
    prompt = FIX_PROMPT.format(
        db_type=state["db_type"],
        schema=schema,
        schema_objects=", ".join(schema_object_names(schema)) or "No schema objects found",
        query=state.get("query", ""),
        error=state.get("error", ""),
    )
    response = llm.invoke([
        {"role": "system", "content": prompt},
        {"role": "user", "content": state.get("user_input", "Fix this query")},
    ])
    fixed = clean_query_response(response.content)
    fixed = validate_fixed_query(
        original_query=state.get("query", ""),
        fixed_query=fixed,
        schema=schema,
        db_type=state["db_type"],
    )
    return {**state, "fixed_query": fixed}


def explore_schema(state: dict) -> dict:
    """Answer schema-related questions."""
    llm = get_llm()
    prompt = EXPLORE_PROMPT.format(
        db_type=state["db_type"],
        schema=state["schema"],
        question=state["user_input"],
    )
    response = llm.invoke([
        {"role": "system", "content": prompt},
        {"role": "user", "content": state["user_input"]},
    ])
    return {**state, "explanation": response.content.strip()}
