
from langchain_core.messages import HumanMessage

def trim_to_last_turns(messages: list, max_turns: int) -> list:
    """
    Trimming by user turns instead of message counts
    prevents API errors by keeping entire tool-calling 
    chains intact.
    """
    human_idx = [i for i, m in enumerate(messages) if isinstance(m, HumanMessage)]
    if len(human_idx) <= max_turns:
        return messages
    return messages[human_idx[-max_turns]:]
