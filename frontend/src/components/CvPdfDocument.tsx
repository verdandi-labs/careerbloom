import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type {
  CVTemplateId,
  StructuredCVData,
  SectionOrderItem,
} from "@/lib/cv-templates";
import { orderedSections, splitAtPageBreaks } from "@/lib/cv-templates";

function groupHasContent(keys: string[], data: StructuredCVData): boolean {
  return keys.some((key) => {
    switch (key) {
      case "experience":
        return Array.isArray(data.experience) && data.experience.length > 0;
      case "education":
        return Array.isArray(data.education) && data.education.length > 0;
      case "skills":
        return Array.isArray(data.skills) && data.skills.length > 0;
      case "languages":
        return Array.isArray(data.languages) && data.languages.length > 0;
      case "contact":
        return Array.isArray(data.contact) && data.contact.length > 0;
      case "awards":
        return Array.isArray(data.awards) && data.awards.length > 0;
      case "publications":
        return Array.isArray(data.publications) && data.publications.length > 0;
      case "volunteer":
        return Array.isArray(data.volunteer) && data.volunteer.length > 0;
      case "projects":
        return Array.isArray(data.projects) && data.projects.length > 0;
      case "references":
        return (
          typeof data.references === "string" &&
          data.references.trim().length > 0
        );
      case "certifications":
        return (
          typeof data.certifications === "string" &&
          data.certifications.trim().length > 0
        );
      case "other":
        return typeof data.other === "string" && data.other.trim().length > 0;
      case "summary":
        return (
          typeof data.summary === "string" && data.summary.trim().length > 0
        );
      default:
        return false;
    }
  });
}

const CLASSIC_INK = "#111";
const CLASSIC_MUTED = "#666";
const CLASSIC_RULE = "#d0c8c4";

function ClassicPdfDocument({
  data,
  sectionOrder,
  pdfScale = 1.0,
}: {
  data: StructuredCVData;
  sectionOrder?: SectionOrderItem[];
  pdfScale?: number;
}) {
  const contactText = data.contact
    .map((c) => c.detail)
    .filter(Boolean)
    .join(" · ");

  const allKeys = orderedSections(sectionOrder, [
    "experience",
    "education",
    "skills",
    "languages",
  ]);
  const groups = splitAtPageBreaks(sectionOrder, allKeys);

  const sc = 0.75 * pdfScale;

  const styles = StyleSheet.create({
    page: {
      fontFamily: "DM Sans",
      backgroundColor: "#ffffff",
      paddingHorizontal: 48,
      paddingTop: 30,
      paddingBottom: 40,
      flexDirection: "column",
    },
    name: {
      fontFamily: "Playfair Display",
      fontSize: 36 * sc,
      fontWeight: 700,
      color: CLASSIC_INK,
      textAlign: "center",
      marginBottom: 6,
    },
    contactLine: {
      fontSize: 9 * sc,
      color: CLASSIC_MUTED,
      textAlign: "center",
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginBottom: 16,
    },
    rule: {
      height: 1,
      backgroundColor: CLASSIC_RULE,
      marginVertical: 16,
    },
    sectionLabel: {
      fontFamily: "Playfair Display",
      fontSize: 9 * sc,
      textTransform: "uppercase",
      letterSpacing: 2,
      color: CLASSIC_INK,
      fontWeight: 600,
      marginBottom: 12,
    },
    summaryText: {
      fontSize: 9 * sc,
      lineHeight: 1.6,
      color: CLASSIC_MUTED,
    },
    expRole: {
      fontFamily: "Playfair Display",
      fontSize: 10.5 * sc,
      fontWeight: 700,
      color: CLASSIC_INK,
    },
    expDate: {
      fontSize: 7.5 * sc,
      color: CLASSIC_MUTED,
    },
    expCompany: {
      fontSize: 7.5 * sc,
      fontStyle: "normal",
      color: CLASSIC_MUTED,
      marginBottom: 2,
    },
    expComment: {
      fontSize: 8.25 * sc,
      color: CLASSIC_MUTED,
      lineHeight: 1.5,
    },
    bottomRow: {
      flexDirection: "row",
      gap: 32,
    },
    bottomCol: {
      flex: 1,
    },
    skillText: {
      fontSize: 8.25 * sc,
      color: CLASSIC_MUTED,
      lineHeight: 1.6,
    },
    languageRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    languageName: {
      fontSize: 9 * sc,
      color: CLASSIC_INK,
    },
    languageLevel: {
      fontSize: 9 * sc,
      color: CLASSIC_MUTED,
    },
  });

  function renderSection(key: string) {
    if (key === "experience" && data.experience.length > 0) {
      return (
        <View key="experience" style={{ marginBottom: 20 }}>
          <Text style={styles.sectionLabel}>Experience</Text>
          {data.experience.map((item, i) => (
            <View key={i} style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <Text style={styles.expRole}>{item.title ?? item.company}</Text>
                {(item.start_date || item.end_date) && (
                  <Text style={styles.expDate}>
                    {item.start_date && item.end_date
                      ? `${item.start_date} – ${item.end_date}`
                      : (item.start_date ?? item.end_date)}
                  </Text>
                )}
              </View>
              {item.title && item.company && (
                <Text style={styles.expCompany}>{item.company}</Text>
              )}
              {item.city && <Text style={styles.expCompany}>{item.city}</Text>}
              {item.comments && (
                <Text style={styles.expComment}>{item.comments}</Text>
              )}
            </View>
          ))}
        </View>
      );
    }
    if (key === "education" && data.education.length > 0) {
      return (
        <View key="education" style={{ marginBottom: 20 }}>
          <Text style={styles.sectionLabel}>Education</Text>
          {data.education.map((item, i) => (
            <View key={i} style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <Text style={styles.expRole}>{item.edu_center}</Text>
                {(item.start_date || item.end_date) && (
                  <Text style={styles.expDate}>
                    {item.start_date && item.end_date
                      ? `${item.start_date} – ${item.end_date}`
                      : (item.start_date ?? item.end_date)}
                  </Text>
                )}
              </View>
              {item.city && <Text style={styles.expCompany}>{item.city}</Text>}
            </View>
          ))}
        </View>
      );
    }
    if (key === "skills" && data.skills.length > 0) {
      return (
        <View key="skills">
          <Text style={styles.sectionLabel}>Skills</Text>
          <Text style={styles.skillText}>
            {data.skills
              .map((item) => item.skill)
              .filter(Boolean)
              .join(", ")}
          </Text>
        </View>
      );
    }
    if (key === "languages" && data.languages.length > 0) {
      return (
        <View key="languages">
          <Text style={styles.sectionLabel}>Languages</Text>
          {data.languages.map((item, i) => (
            <View key={i} style={styles.languageRow}>
              <Text style={styles.languageName}>{item.language}</Text>
              {item.level && (
                <Text style={styles.languageLevel}>{item.level}</Text>
              )}
            </View>
          ))}
        </View>
      );
    }
    return null;
  }

  return (
    <Document>
      {groups.map((group, gi) => {
        if (!groupHasContent(group, data)) return null;
        return (
          <Page key={gi} size="A4" style={styles.page}>
            {gi === 0 && (
              <>
                <Text style={styles.name}>{data.name}</Text>
                <Text style={styles.contactLine}>
                  {data.title ? `${data.title}${contactText ? " · " : ""}` : ""}
                  {contactText}
                </Text>
                <View style={styles.rule} />
                {data.summary && (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={styles.sectionLabel}>Profile</Text>
                    <Text style={styles.summaryText}>{data.summary}</Text>
                  </View>
                )}
                <View style={styles.rule} />
              </>
            )}
            {gi > 0 && (
              <View
                style={{
                  marginTop: 24,
                  borderTopWidth: 1,
                  borderTopColor: "#e5e7eb",
                  borderTopStyle: "dashed",
                  paddingTop: 24,
                }}
              />
            )}
            {group.map((key) => (
              <View key={key}>
                {renderSection(key)}
                <View style={styles.rule} />
              </View>
            ))}
          </Page>
        );
      })}
    </Document>
  );
}

export function CvPdfDocument({
  data,
  sectionOrder,
  pdfScale = 1.0,
}: {
  data: StructuredCVData;
  template: CVTemplateId;
  sectionOrder?: SectionOrderItem[];
  pdfScale?: number;
}) {
  return (
    <ClassicPdfDocument
      data={data}
      sectionOrder={sectionOrder}
      pdfScale={pdfScale}
    />
  );
}
