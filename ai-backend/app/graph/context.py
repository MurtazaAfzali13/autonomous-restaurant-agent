from langchain_core.messages import HumanMessage


def trim_to_last_turns(messages: list, max_turns: int) -> list:
    """
    فقط «max_turns» نوبت آخرِ کاربر را نگه می‌دارد (فقط برای ارسال به LLM؛ state و
    checkpointer دست‌نخورده می‌مانند).

    چرا بر اساس نوبت و نه «۴ پیام آخر»؟ یک نوبت ممکن است چند پیام داشته باشد:
        Human -> AI(tool_call) -> Tool -> AI(tool_call) -> Tool -> AI
    اگر وسط این زنجیره ببریم، یک ToolMessage بدون tool_call (یا برعکس) به مدل می‌رسد و
    OpenAI/OpenRouter خطای 400 می‌دهد. شروع پنجره از یک HumanMessage، جفت‌های
    tool_call/ToolMessage را همیشه سالم نگه می‌دارد.
    """
    human_idx = [i for i, m in enumerate(messages) if isinstance(m, HumanMessage)]
    if len(human_idx) <= max_turns:
        return messages
    return messages[human_idx[-max_turns]:]
