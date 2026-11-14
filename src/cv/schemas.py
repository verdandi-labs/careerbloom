from pydantic import BaseModel, Field, field_validator

MAX_EXPORT_STRING = 20_000
MAX_EXPORT_SECTIONS = 50


class _RawEntry(BaseModel):
    @field_validator("*")
    @classmethod
    def _clean(cls, v):
        if isinstance(v, str):
            return v.strip() or None
        return v


class ContactDetailRaw(_RawEntry):
    detail: str | None = None


class ExperienceRaw(_RawEntry):
    title: str | None = None
    company: str | None = None
    city: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    comments: str | None = None


class SkillRaw(_RawEntry):
    skill: str | None = None
    comments: str | None = None


class TechStackRaw(_RawEntry):
    name: str | None = None
    comments: str | None = None


class EducationRaw(_RawEntry):
    edu_center: str | None = None
    city: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    comments: str | None = None


class AwardRaw(_RawEntry):
    name: str | None = None
    date: str | None = None
    comments: str | None = None


class PublicationRaw(_RawEntry):
    name: str | None = None
    date: str | None = None
    comments: str | None = None


class VolunteeringRaw(_RawEntry):
    center: str | None = None
    city: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    comments: str | None = None


class ProjectRaw(_RawEntry):
    name: str | None = None
    organisation: str | None = None
    link: str | None = None
    tech_stack: str | None = None
    comments: str | None = None


class LanguageRaw(_RawEntry):
    language: str | None = None
    level: str | None = None
    comments: str | None = None


class ContactDetailItem(ContactDetailRaw):
    line_num: int


class ExperienceItem(ExperienceRaw):
    line_num: int


class SkillItem(SkillRaw):
    line_num: int


class TechStackItem(TechStackRaw):
    line_num: int


class EducationItem(EducationRaw):
    line_num: int


class AwardItem(AwardRaw):
    line_num: int


class PublicationItem(PublicationRaw):
    line_num: int


class VolunteeringItem(VolunteeringRaw):
    line_num: int


class ProjectItem(ProjectRaw):
    line_num: int


class LanguageItem(LanguageRaw):
    line_num: int


RAW_MODELS = {
    "contact_details": ContactDetailRaw,
    "experience": ExperienceRaw,
    "skills": SkillRaw,
    "tech_stack": TechStackRaw,
    "education": EducationRaw,
    "awards": AwardRaw,
    "publications": PublicationRaw,
    "volunteering": VolunteeringRaw,
    "projects": ProjectRaw,
    "languages": LanguageRaw,
}

FIELD_MODELS = {
    "contact_details": ContactDetailItem,
    "experience": ExperienceItem,
    "skills": SkillItem,
    "tech_stack": TechStackItem,
    "education": EducationItem,
    "awards": AwardItem,
    "publications": PublicationItem,
    "volunteering": VolunteeringItem,
    "projects": ProjectItem,
    "languages": LanguageItem,
}

TEXT_FIELDS = {"full_name", "headline", "self_summary"}


class CvRawText(BaseModel):
    text: str


class CvData(BaseModel):
    full_name: str | None = None
    headline: str | None = None
    self_summary: str | None = None
    contact_details: list[ContactDetailItem] | None = None
    experience: list[ExperienceItem] | None = None
    skills: list[SkillItem] | None = None
    tech_stack: list[TechStackItem] | None = None
    education: list[EducationItem] | None = None
    awards: list[AwardItem] | None = None
    publications: list[PublicationItem] | None = None
    volunteering: list[VolunteeringItem] | None = None
    projects: list[ProjectItem] | None = None
    languages: list[LanguageItem] | None = None

    @field_validator("full_name", "headline", "self_summary")
    @classmethod
    def _clean_text(cls, v: str | None) -> str | None:
        return v.strip() or None if v else None

    def has_content(self) -> bool:
        return any(getattr(self, field) for field in type(self).model_fields)

    model_config = {"from_attributes": True}


class CvEditRequest(BaseModel):
    field: str
    value: str | list[dict] | None = None


class CvRowPatchRequest(BaseModel):
    fields: dict[str, str | None]


class CvTranslateRequest(BaseModel):
    language: str = Field(..., min_length=2, max_length=5)


class SaveVersionRequest(BaseModel):
    cv_name: str = Field(..., min_length=1, max_length=100)
    data: CvData | None = None


class VersionListItem(BaseModel):
    version_id: str
    cv_name: str
    created_at: str

    model_config = {"from_attributes": True}


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
