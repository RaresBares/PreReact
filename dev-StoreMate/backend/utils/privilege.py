from fastapi import Depends, HTTPException
from enum import Enum
from sqlalchemy.types import TypeDecorator, String

class Privilege(str, Enum):
    U = "user"
    S = "supervisor"
    M = "master"

    def __lt__(self, other):
        levels = {Privilege.U: 1, Privilege.S: 2, Privilege.M: 3}
        return levels[self] < levels.get(other, 0)

    def __le__(self, other): return self < other or self == other
    def __gt__(self, other): return not self <= other
    def __ge__(self, other): return not self < other


class PrivilegeType(TypeDecorator):
    impl = String

    def process_bind_param(self, value, dialect):
        if isinstance(value, Privilege):
            return value.value
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return Privilege(value)
