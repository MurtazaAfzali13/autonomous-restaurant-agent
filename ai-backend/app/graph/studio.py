from app.graph.build import build_graph

# LangGraph Studio خودش مدیریت state و checkpointer را بر عهده می‌گیرد،
# بنابراین اینجا checkpointer=None پاس می‌دهیم.
graph = build_graph(checkpointer=None)