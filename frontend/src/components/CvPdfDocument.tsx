import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type {
  CVTemplateId,
  StructuredCVData,
  SectionOrderItem,
} from "@/lib/cv-templates";
import { orderedSections } from "@/lib/cv-templates";

function groupHasContent(keys: string[], data: StructuredCVData): boolean {
  return keys.some((key) => {
    const value = data[key as keyof StructuredCVData];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
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
  const contactText = data.contact_details
    .map((c) => c.detail)
    .filter(Boolean)
    .join(" · ");

  const allKeys = orderedSections(sectionOrder, [
    "experience",
    "education",
    "skills",
    "tech_stack",
    "languages",
    "awards",
    "publications",
    "volunteering",
    "projects",
  ]);

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

  function renderCommentLines(comments: string | undefined) {
    return (comments ?? "")
      .split("\n")
      .filter(Boolean)
      .map((line, i) => (
        <Text key={i} style={styles.expComment}>
          {line}
        </Text>
      ));
  }

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
              {renderCommentLines(item.comments)}
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
              {renderCommentLines(item.comments)}
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
          {renderCommentLines(
            data.skills
              .map((item) => item.comments)
              .filter(Boolean)
              .join("\n"),
          )}
        </View>
      );
    }
    if (key === "languages" && data.languages.length > 0) {
      return (
        <View key="languages">
          <Text style={styles.sectionLabel}>Languages</Text>
          {data.languages.map((item, i) => (
            <View key={i}>
              <View style={styles.languageRow}>
                <Text style={styles.languageName}>{item.language}</Text>
                {item.level && (
                  <Text style={styles.languageLevel}>{item.level}</Text>
                )}
              </View>
              {renderCommentLines(item.comments)}
            </View>
          ))}
        </View>
      );
    }
    if (key === "tech_stack" && data.tech_stack.length > 0) {
      return (
        <View key="tech_stack" style={{ marginBottom: 20 }}>
          <Text style={styles.sectionLabel}>Tech Stack</Text>
          {data.tech_stack.map((item, i) => (
            <View key={i} style={{ marginBottom: 8 }}>
              <Text style={styles.skillText}>{item.name}</Text>
              {renderCommentLines(item.comments)}
            </View>
          ))}
        </View>
      );
    }
    if (key === "awards" && data.awards.length > 0) {
      return (
        <View key="awards" style={{ marginBottom: 20 }}>
          <Text style={styles.sectionLabel}>Awards</Text>
          {data.awards.map((item, i) => (
            <View key={i} style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <Text style={styles.expRole}>{item.name}</Text>
                {item.date && <Text style={styles.expDate}>{item.date}</Text>}
              </View>
              {renderCommentLines(item.comments)}
            </View>
          ))}
        </View>
      );
    }
    if (key === "publications" && data.publications.length > 0) {
      return (
        <View key="publications" style={{ marginBottom: 20 }}>
          <Text style={styles.sectionLabel}>Publications</Text>
          {data.publications.map((item, i) => (
            <View key={i} style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <Text style={styles.expRole}>{item.name}</Text>
                {item.date && <Text style={styles.expDate}>{item.date}</Text>}
              </View>
              {renderCommentLines(item.comments)}
            </View>
          ))}
        </View>
      );
    }
    if (key === "volunteering" && data.volunteering.length > 0) {
      return (
        <View key="volunteering" style={{ marginBottom: 20 }}>
          <Text style={styles.sectionLabel}>Volunteering</Text>
          {data.volunteering.map((item, i) => (
            <View key={i} style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <Text style={styles.expRole}>{item.center}</Text>
                {(item.start_date || item.end_date) && (
                  <Text style={styles.expDate}>
                    {item.start_date && item.end_date
                      ? `${item.start_date} – ${item.end_date}`
                      : (item.start_date ?? item.end_date)}
                  </Text>
                )}
              </View>
              {item.city && <Text style={styles.expCompany}>{item.city}</Text>}
              {renderCommentLines(item.comments)}
            </View>
          ))}
        </View>
      );
    }
    if (key === "projects" && data.projects.length > 0) {
      return (
        <View key="projects" style={{ marginBottom: 20 }}>
          <Text style={styles.sectionLabel}>Projects</Text>
          {data.projects.map((item, i) => (
            <View key={i} style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <Text style={styles.expRole}>{item.name}</Text>
                {item.link && <Text style={styles.expDate}>{item.link}</Text>}
              </View>
              {item.organisation && (
                <Text style={styles.expCompany}>{item.organisation}</Text>
              )}
              {item.tech_stack && (
                <Text style={styles.expCompany}>{item.tech_stack}</Text>
              )}
              {renderCommentLines(item.comments)}
            </View>
          ))}
        </View>
      );
    }
    return null;
  }

  return (
    <Document>
      {groupHasContent(allKeys, data) && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.name}>{data.full_name}</Text>
          <Text style={styles.contactLine}>
            {data.headline ? `${data.headline}${contactText ? " · " : ""}` : ""}
            {contactText}
          </Text>
          <View style={styles.rule} />
          {data.self_summary && (
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.sectionLabel}>Profile</Text>
              <Text style={styles.summaryText}>{data.self_summary}</Text>
            </View>
          )}
          <View style={styles.rule} />
          {allKeys.map((key) => (
            <View key={key}>
              {renderSection(key)}
              <View style={styles.rule} />
            </View>
          ))}
        </Page>
      )}
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
