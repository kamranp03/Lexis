"""LangGraph agent for DB Pro AI features."""

from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional

from app.ai.nodes import (
    route_intent, generate_query, explain_results,
    optimize_query, fix_query, explore_schema,
)


class AgentState(TypedDict, total=False):
    # Inputs
    user_input: str
    db_type: str
    schema: str
    query: str             # existing query (for optimize/fix/explain)
    error: str             # error message (for fix)
    results_preview: list  # query results (for explain)

    # Routing
    intent: str

    # Outputs
    generated_query: str
    fixed_query: str
    explanation: str
    optimization: str


def _route_by_intent(state: AgentState) -> str:
    intent = state.get("intent", "query")
    return intent


def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("router", route_intent)
    graph.add_node("query_gen", generate_query)
    graph.add_node("explain", explain_results)
    graph.add_node("optimize", optimize_query)
    graph.add_node("fix", fix_query)
    graph.add_node("explore", explore_schema)

    # Entry point
    graph.set_entry_point("router")

    # Conditional routing from router
    graph.add_conditional_edges(
        "router",
        _route_by_intent,
        {
            "query": "query_gen",
            "explain": "explain",
            "optimize": "optimize",
            "fix": "fix",
            "explore": "explore",
        },
    )

    # All nodes end after execution
    graph.add_edge("query_gen", END)
    graph.add_edge("explain", END)
    graph.add_edge("optimize", END)
    graph.add_edge("fix", END)
    graph.add_edge("explore", END)

    return graph.compile()


# Singleton compiled graph
agent = build_graph()
