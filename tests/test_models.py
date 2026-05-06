from condition_navigator.models import model_family_rank


def test_model_family_rank_known_families():
    assert model_family_rank("claude-haiku-4-5-20251001") == 1
    assert model_family_rank("claude-sonnet-4-6") == 2
    assert model_family_rank("claude-opus-4-7") == 3


def test_model_family_rank_handles_future_dot_releases():
    """New within-family versions inherit the family from substring match — no code change needed."""
    assert model_family_rank("claude-sonnet-4-7") == 2
    assert model_family_rank("claude-sonnet-5-0-pre") == 2
    assert model_family_rank("claude-haiku-99") == 1
    assert model_family_rank("claude-opus-future") == 3


def test_model_family_rank_is_case_insensitive():
    assert model_family_rank("CLAUDE-SONNET-4-6") == 2
    assert model_family_rank("Claude-Opus") == 3


def test_model_family_rank_unknown_returns_zero():
    """Unknown families rank below all known ones — anything else is treated as an upgrade."""
    assert model_family_rank("") == 0
    assert model_family_rank("gpt-5") == 0
    assert model_family_rank("nano") == 0


def test_model_family_rank_ordering():
    """The rank values must be strictly ordered haiku < sonnet < opus."""
    assert model_family_rank("haiku") < model_family_rank("sonnet") < model_family_rank("opus")
