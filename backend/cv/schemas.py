from pydantic import BaseModel, field_validator

MAX_EXPORT_STRING = 20_000
MAX_EXPORT_SECTIONS = 50


class _LineItem(BaseModel):
    line_num: int

    @field_validator("*")
    @classmethod
    def _clean(cls, v):
        if isinstance(v, str):
            return v.strip() or None
        return v


class ContactDetailItem(_LineItem):
    detail: str | None = None


class ExperienceItem(_LineItem):
    company: str | None = None
    city: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    comments: str | None = None


class SkillItem(_LineItem):
    skill: str | None = None
    comments: str | None = None


class StudyItem(_LineItem):
    edu_center: str | None = None
    city: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    comments: str | None = None


class AwardItem(_LineItem):
    name: str | None = None
    date: str | None = None
    comments: str | None = None


class PublicationItem(_LineItem):
    name: str | None = None
    date: str | None = None
    comments: str | None = None


class VolunteeringItem(_LineItem):
    center: str | None = None
    city: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    comments: str | None = None


class ProjectItem(_LineItem):
    name: str | None = None
    url: str | None = None
    comments: str | None = None


class LanguageItem(_LineItem):
    language: str | None = None
    level: str | None = None
    comments: str | None = None


FIELD_MODELS = {
    "contact_details": ContactDetailItem,
    "experience": ExperienceItem,
    "skills": SkillItem,
    "studies": StudyItem,
    "awards": AwardItem,
    "publications": PublicationItem,
    "volunteering": VolunteeringItem,
    "projects": ProjectItem,
    "languages": LanguageItem,
}

TEXT_FIELDS = {"full_name", "title", "self_summary"}


class CvData(BaseModel):
    full_name: str | None = None
    title: str | None = None
    self_summary: str | None = None
    contact_details: list[ContactDetailItem] | None = None
    experience: list[ExperienceItem] | None = None
    skills: list[SkillItem] | None = None
    studies: list[StudyItem] | None = None
    awards: list[AwardItem] | None = None
    publications: list[PublicationItem] | None = None
    volunteering: list[VolunteeringItem] | None = None
    projects: list[ProjectItem] | None = None
    languages: list[LanguageItem] | None = None

    @field_validator("full_name", "title", "self_summary")
    @classmethod
    def _clean_text(cls, v: str | None) -> str | None:
        return v.strip() or None if v else None

    model_config = {"from_attributes": True}


class CvEditRequest(BaseModel):
    field: str
    value: str | list[dict] | None = None


class CvTranslateRequest(BaseModel):
    language: str


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