"""LangGraph node functions for the AI agent."""

from langchain_groq import ChatGroq
from app.ai.prompts import (
    ROUTER_PROMPT, QUERY_GEN_PROMPT, EXPLAIN_PROMPT,
    OPTIMIZE_PROMPT, FIX_PROMPT, EXPLORE_PROMPT,
)
from app.config import settings


def get_llm() -> ChatGroq:
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name="openai/gpt-oss-120b",
        temperature=0.6,
    )


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
    query = response.content.strip()
    # Remove markdown code fences if present
    if query.startswith("```"):
        lines = query.split("\n")
        query = "\n".join(lines[1:-1]) if len(lines) > 2 else query
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
    llm = get_llm()
    prompt = FIX_PROMPT.format(
        db_type=state["db_type"],
        schema=state["schema"],
        query=state.get("query", ""),
        error=state.get("error", ""),
    )
    response = llm.invoke([
        {"role": "system", "content": prompt},
        {"role": "user", "content": state.get("user_input", "Fix this query")},
    ])
    fixed = response.content.strip()
    if fixed.startswith("```"):
        lines = fixed.split("\n")
        fixed = "\n".join(lines[1:-1]) if len(lines) > 2 else fixed
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
