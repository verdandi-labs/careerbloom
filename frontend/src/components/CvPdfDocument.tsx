import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import type { CVTemplateId, StructuredCVData } from "@/lib/cv-templates"

const TERRACOTTA = "#CB6843"
const TERRACOTTA_LIGHT = "#FDE8E8"
const SAGE = "#7B9E87"
const SAGE_LIGHT = "#EAF0EC"
const SAGE_MID = "#C5D8CB"
const MUTED = "#9b8b86"
const INK = "#1c1410"

const terracottaStyles = StyleSheet.create({
  page: {
    fontFamily: "DM Sans",
    backgroundColor: "#ffffff",
    flexDirection: "row",
  },
  sidebar: {
    width: 180,
    padding: 20,
    borderRightWidth: 1,
    borderRightColor: TERRACOTTA,
    borderRightStyle: "solid",
    flexDirection: "column",
    gap: 16,
  },
  main: {
    flex: 1,
    padding: 28,
    flexDirection: "column",
    gap: 16,
  },
  sidebarLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: TERRACOTTA,
    marginBottom: 6,
    fontWeight: 700,
  },
  contactItem: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.5,
    marginBottom: 2,
  },
  skillPill: {
    fontSize: 8,
    color: TERRACOTTA,
    backgroundColor: TERRACOTTA_LIGHT,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  languageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  languageName: {
    fontSize: 9,
    color: INK,
  },
  languageLevel: {
    fontSize: 9,
    color: MUTED,
  },
  eduCenter: {
    fontSize: 9,
    fontWeight: 500,
    color: INK,
    marginBottom: 1,
  },
  eduSub: {
    fontSize: 8,
    color: MUTED,
    marginBottom: 1,
  },
  name: {
    fontFamily: "Playfair Display",
    fontSize: 28,
    fontWeight: 700,
    color: INK,
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 11,
    color: TERRACOTTA,
    marginBottom: 6,
  },
  summary: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.6,
    maxWidth: 320,
  },
  divider: {
    height: 1,
    backgroundColor: TERRACOTTA,
    marginVertical: 4,
  },
  experienceSection: {
    flexDirection: "column",
    gap: 12,
  },
  experienceItem: {
    marginBottom: 4,
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  expCompany: {
    fontFamily: "Playfair Display",
    fontSize: 10,
    fontWeight: 700,
    color: INK,
  },
  expCity: {
    fontSize: 8,
    color: TERRACOTTA,
    marginTop: 1,
  },
  dateBadge: {
    fontSize: 8,
    color: MUTED,
    backgroundColor: TERRACOTTA_LIGHT,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  expComments: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.5,
  },
  sectionBlock: {
    marginBottom: 4,
  },
})

const sageStyles = StyleSheet.create({
  page: {
    fontFamily: "DM Sans",
    backgroundColor: "#ffffff",
    flexDirection: "column",
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: SAGE_LIGHT,
    borderBottomStyle: "solid",
  },
  cvLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: SAGE,
    marginBottom: 8,
  },
  name: {
    fontFamily: "Playfair Display",
    fontSize: 28,
    fontWeight: 700,
    color: INK,
    marginBottom: 4,
  },
  contactLine: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 10,
  },
  summaryBox: {
    backgroundColor: SAGE_LIGHT,
    padding: 8,
    borderRadius: 4,
  },
  summaryText: {
    fontSize: 9,
    lineHeight: 1.6,
    color: "#4a4a4a",
  },
  body: {
    flex: 1,
    flexDirection: "row",
  },
  mainCol: {
    flex: 1,
    padding: 28,
    paddingRight: 20,
  },
  sideCol: {
    width: 160,
    padding: 28,
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: SAGE_LIGHT,
    borderLeftStyle: "solid",
  },
  sectionLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: SAGE,
    fontWeight: 700,
    marginBottom: 4,
  },
  sectionRule: {
    height: 1,
    backgroundColor: SAGE_MID,
    marginBottom: 10,
  },
  expCompany: {
    fontFamily: "Playfair Display",
    fontSize: 10,
    fontWeight: 700,
    color: INK,
  },
  expCity: {
    fontSize: 8,
    color: SAGE,
    marginTop: 1,
  },
  dateBadge: {
    fontSize: 8,
    color: SAGE,
    backgroundColor: SAGE_LIGHT,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  expComments: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.5,
    marginTop: 2,
  },
  experienceItem: {
    marginBottom: 8,
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  eduCenter: {
    fontFamily: "Playfair Display",
    fontSize: 10,
    fontWeight: 700,
    color: INK,
  },
  eduSub: {
    fontSize: 8,
    color: MUTED,
    marginBottom: 1,
  },
  skillItem: {
    fontSize: 9,
    color: INK,
    marginBottom: 2,
  },
  languageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  languageName: {
    fontSize: 9,
    color: INK,
  },
  languageLevel: {
    fontSize: 9,
    color: MUTED,
  },
  sectionBlock: {
    marginBottom: 12,
  },
})

function TerracottaPdfDocument({ data }: { data: StructuredCVData }) {
  return (
    <Document>
      <Page size="A4" style={terracottaStyles.page}>
        <View style={terracottaStyles.sidebar}>
          {data.contact.length > 0 && (
            <View style={terracottaStyles.sectionBlock}>
              <Text style={terracottaStyles.sidebarLabel}>Contact</Text>
              {data.contact.map((item, i) => (
                <Text key={i} style={terracottaStyles.contactItem}>{item.detail}</Text>
              ))}
            </View>
          )}

          {data.skills.length > 0 && (
            <View style={terracottaStyles.sectionBlock}>
              <Text style={terracottaStyles.sidebarLabel}>Skills</Text>
              <View style={terracottaStyles.skillsWrap}>
                {data.skills.map((item, i) => (
                  <Text key={i} style={terracottaStyles.skillPill}>{item.skill}</Text>
                ))}
              </View>
            </View>
          )}

          {data.languages.length > 0 && (
            <View style={terracottaStyles.sectionBlock}>
              <Text style={terracottaStyles.sidebarLabel}>Languages</Text>
              {data.languages.map((item, i) => (
                <View key={i} style={terracottaStyles.languageRow}>
                  <Text style={terracottaStyles.languageName}>{item.language}</Text>
                  {item.level && <Text style={terracottaStyles.languageLevel}>{item.level}</Text>}
                </View>
              ))}
            </View>
          )}

          {data.education.length > 0 && (
            <View style={terracottaStyles.sectionBlock}>
              <Text style={terracottaStyles.sidebarLabel}>Education</Text>
              {data.education.map((item, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                  <Text style={terracottaStyles.eduCenter}>{item.edu_center}</Text>
                  <Text style={terracottaStyles.eduSub}>
                    {[item.city, item.end_date ?? item.start_date].filter(Boolean).join(" · ")}
                  </Text>
                  {item.comments && <Text style={terracottaStyles.eduSub}>{item.comments}</Text>}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={terracottaStyles.main}>
          {data.name && (
            <View>
              <Text style={terracottaStyles.name}>{data.name}</Text>
              {data.title && <Text style={terracottaStyles.jobTitle}>{data.title}</Text>}
              {data.summary && <Text style={terracottaStyles.summary}>{data.summary}</Text>}
            </View>
          )}

          <View style={terracottaStyles.divider} />

          {data.experience.length > 0 && (
            <View>
              <Text style={terracottaStyles.sidebarLabel}>Experience</Text>
              <View style={terracottaStyles.experienceSection}>
                {data.experience.map((item, i) => (
                  <View key={i} style={terracottaStyles.experienceItem}>
                    <View style={terracottaStyles.expHeader}>
                      <View>
                        <Text style={terracottaStyles.expCompany}>{item.company}</Text>
                        {item.city && <Text style={terracottaStyles.expCity}>{item.city}</Text>}
                      </View>
                      {(item.start_date || item.end_date) && (
                        <Text style={terracottaStyles.dateBadge}>
                          {item.start_date && item.end_date
                            ? `${item.start_date} – ${item.end_date}`
                            : item.start_date ?? item.end_date}
                        </Text>
                      )}
                    </View>
                    {item.comments && (
                      <Text style={terracottaStyles.expComments}>{item.comments}</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}

function SagePdfDocument({ data }: { data: StructuredCVData }) {
  const contactText = data.contact.map((c) => c.detail).filter(Boolean).join(" · ")

  return (
    <Document>
      <Page size="A4" style={sageStyles.page}>
        {/* Header */}
        <View style={sageStyles.header}>
          <Text style={sageStyles.cvLabel}>Curriculum Vitae</Text>
          {data.name && <Text style={sageStyles.name}>{data.name}</Text>}
          <Text style={sageStyles.contactLine}>
            {data.title ? `${data.title}${contactText ? " · " : ""}` : ""}{contactText}
          </Text>
          {data.summary && (
            <View style={sageStyles.summaryBox}>
              <Text style={sageStyles.summaryText}>{data.summary}</Text>
            </View>
          )}
        </View>

        {/* Body */}
        <View style={sageStyles.body}>
          {/* Left main */}
          <View style={sageStyles.mainCol}>
            {data.experience.length > 0 && (
              <View style={sageStyles.sectionBlock}>
                <Text style={sageStyles.sectionLabel}>Experience</Text>
                <View style={sageStyles.sectionRule} />
                {data.experience.map((item, i) => (
                  <View key={i} style={sageStyles.experienceItem}>
                    <View style={sageStyles.expHeader}>
                      <View>
                        <Text style={sageStyles.expCompany}>{item.company}</Text>
                        {item.city && <Text style={sageStyles.expCity}>{item.city}</Text>}
                      </View>
                      {(item.start_date || item.end_date) && (
                        <Text style={sageStyles.dateBadge}>
                          {item.start_date && item.end_date
                            ? `${item.start_date} – ${item.end_date}`
                            : item.start_date ?? item.end_date}
                        </Text>
                      )}
                    </View>
                    {item.comments && (
                      <Text style={sageStyles.expComments}>{item.comments}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {data.education.length > 0 && (
              <View style={sageStyles.sectionBlock}>
                <Text style={sageStyles.sectionLabel}>Education</Text>
                <View style={sageStyles.sectionRule} />
                {data.education.map((item, i) => (
                  <View key={i} style={sageStyles.experienceItem}>
                    <View style={sageStyles.expHeader}>
                      <View>
                        <Text style={sageStyles.eduCenter}>{item.edu_center}</Text>
                        {item.city && <Text style={sageStyles.eduSub}>{item.city}</Text>}
                      </View>
                      {(item.start_date || item.end_date) && (
                        <Text style={sageStyles.dateBadge}>
                          {item.start_date && item.end_date
                            ? `${item.start_date} – ${item.end_date}`
                            : item.start_date ?? item.end_date}
                        </Text>
                      )}
                    </View>
                    {item.comments && (
                      <Text style={sageStyles.expComments}>{item.comments}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right sidebar */}
          <View style={sageStyles.sideCol}>
            {data.skills.length > 0 && (
              <View style={sageStyles.sectionBlock}>
                <Text style={sageStyles.sectionLabel}>Skills</Text>
                <View style={sageStyles.sectionRule} />
                {data.skills.map((item, i) => (
                  <Text key={i} style={sageStyles.skillItem}>{item.skill}</Text>
                ))}
              </View>
            )}

            {data.languages.length > 0 && (
              <View style={sageStyles.sectionBlock}>
                <Text style={sageStyles.sectionLabel}>Languages</Text>
                <View style={sageStyles.sectionRule} />
                {data.languages.map((item, i) => (
                  <View key={i} style={sageStyles.languageRow}>
                    <Text style={sageStyles.languageName}>{item.language}</Text>
                    {item.level && <Text style={sageStyles.languageLevel}>{item.level}</Text>}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  )
}

export function CvPdfDocument({
  data,
  template,
}: {
  data: StructuredCVData
  template: CVTemplateId
}) {
  if (template === "sage") return <SagePdfDocument data={data} />
  return <TerracottaPdfDocument data={data} />
}
