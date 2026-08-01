from pydantic import BaseModel, field_validator
from uuid import UUID

MAX_EXPORT_STRING = 20_000
MAX_EXPORT_SECTIONS = 50


class CvSectionResponse(BaseModel):
    id: UUID
    section: str
    content_en: str
    content_es: str

    model_config = {"from_attributes": True}


class CvSectionUpdate(BaseModel):
    content_en: str | None = None
    content_es: str | None = None


class CvAllSectionsResponse(BaseModel):
    name: str | None
    title: dict[str, str]
    contact: dict[str, str]
    photo_url: str | None
    sections: dict[str, dict[str, str]]


class CvParseRequest(BaseModel):
    text: str


class CvParseResponse(BaseModel):
    name: str
    title: str
    contact: str
    summary: str
    experience: str
    education: str
    skills: str
    languages: str
    certifications: str
    projects: str
    volunteer: str
    awards: str
    publications: str
    references: str
    other: str


class CvTranslateRequest(BaseModel):
    fields: dict[str, str]
    target_lang: str = "Spanish"


class CvTranslateResponse(BaseModel):
    fields: dict[str, str]


class CvAcceptSection(BaseModel):
    section: str
    content_en: str = ""
    content_es: str = ""


class CvAcceptRequest(BaseModel):
    file_name: str | None = None
    extracted_text: str
    sections: list[CvAcceptSection]


class CvExportPdfRequest(BaseModel):
    name: str | None = None
    sections: list[dict[str, str]]
    language: str | None = None

    @field_validator("name")
    @classmethod
    def cap_name(cls, v: str | None) -> str | None:
        if v and len(v) > MAX_EXPORT_STRING:
            raise ValueError("name too long")
        return v

    @field_validator("sections")
    @classmethod
    def cap_sections(cls, v: list[dict[str, str]]) -> list[dict[str, str]]:
        if len(v) > MAX_EXPORT_SECTIONS:
            raise ValueError("too many sections")
        for section in v:
            for value in section.values():
                if len(value) > MAX_EXPORT_STRING:
                    raise ValueError("section content too long")
        return v


class CvExportDocxRequest(BaseModel):
    data: dict
    template: str
    language: str = "en"

    @field_validator("data")
    @classmethod
    def cap_data(cls, v: dict) -> dict:
        for value in v.values():
            if isinstance(value, str) and len(value) > MAX_EXPORT_STRING:
                raise ValueError("field too long")
            if isinstance(value, dict):
                for inner in value.values():
                    if isinstance(inner, str) and len(inner) > MAX_EXPORT_STRING:
                        raise ValueError("field too long")
        return v
