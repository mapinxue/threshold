from app.services.security import hash_password, hash_token, new_token, verify_password


def test_password_hash_round_trip() -> None:
    encoded = hash_password("correct horse battery staple")

    assert encoded != "correct horse battery staple"
    assert verify_password("correct horse battery staple", encoded)
    assert not verify_password("wrong password", encoded)


def test_token_generation_and_hashing() -> None:
    first = new_token("thk_")
    second = new_token("thk_")

    assert first.startswith("thk_")
    assert first != second
    assert hash_token(first) != first


def test_invalid_password_hash_is_rejected() -> None:
    assert not verify_password("password", "not-a-valid-hash")
