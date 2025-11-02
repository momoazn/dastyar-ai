from apps.whisper.api.text_normalize import normalize_persian


def test_normalize_persian_basic_chars():
    # Arabic Yeh/Kaf to Persian forms
    assert normalize_persian("علي و بيك") == "علی و بیک"


def test_normalize_persian_punct_and_spaces():
    raw = "سلام , حال شما چطور است ?  خوبم ; ممنون!"
    expected = "سلام، حال شما چطور است؟ خوبم؛ ممنون!"
    assert normalize_persian(raw) == expected


def test_normalize_persian_collapse_spaces_and_tatweel():
    raw = "اینـــ   یک   متن  است ."
    # Remove tatweel, collapse spaces, fix spacing around period
    assert normalize_persian(raw) == "این یک متن است."
