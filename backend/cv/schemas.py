from pydantic import BaseModel
from uuid import UUID


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


class CvExportDocxRequest(BaseModel):
    data: dict
    template: str
    language: str = "en"
