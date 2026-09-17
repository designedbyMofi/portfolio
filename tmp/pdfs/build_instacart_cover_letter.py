from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


OUTPUT = "output/pdf/Mofifoluwa-Olawuyi-Instacart-Cover-Letter.pdf"


def build_pdf():
    pdfmetrics.registerFont(TTFont("Fraunces", "tmp/pdfs/fonts/Fraunces-SemiBold.ttf"))
    pdfmetrics.registerFont(TTFont("Inter", "tmp/pdfs/fonts/Inter.ttf"))

    canvas = HexColor("#FAF8F6")
    ink = HexColor("#1E1B24")
    body = HexColor("#5B4F4B")
    muted = HexColor("#ABA09C")
    rose = HexColor("#AD4E73")
    rule = HexColor("#E8E4E3")

    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        rightMargin=24 * mm,
        leftMargin=24 * mm,
        topMargin=21 * mm,
        bottomMargin=22 * mm,
        title="Cover Letter - Senior Product Designer II, Order Quality at Instacart",
        author="Mofifoluwa Olawuyi",
        subject="Application for Senior Product Designer II - Order Quality at Instacart",
    )

    def background(pdf, _doc):
        pdf.saveState()
        pdf.setFillColor(canvas)
        pdf.rect(0, 0, A4[0], A4[1], stroke=0, fill=1)
        pdf.restoreState()

    name_style = ParagraphStyle(
        "Name", fontName="Fraunces", fontSize=22, leading=25, textColor=ink,
    )
    role_style = ParagraphStyle(
        "Role", fontName="Inter", fontSize=10.3, leading=14, textColor=muted,
    )
    contact_style = ParagraphStyle(
        "Contact", fontName="Inter", fontSize=8.9, leading=12.8,
        textColor=body, alignment=TA_RIGHT,
    )
    date_style = ParagraphStyle(
        "Date", fontName="Inter", fontSize=9.4, leading=13,
        textColor=muted, spaceAfter=16,
    )
    greeting_style = ParagraphStyle(
        "Greeting", fontName="Inter", fontSize=10.5, leading=16,
        textColor=ink, spaceAfter=11,
    )
    body_style = ParagraphStyle(
        "Body", fontName="Inter", fontSize=10.2, leading=16.2,
        textColor=body, spaceAfter=11.5, alignment=TA_LEFT,
    )
    signoff_style = ParagraphStyle(
        "Signoff", fontName="Inter", fontSize=10.2, leading=16, textColor=body,
    )

    header_name = Paragraph("Mofifoluwa Olawuyi.", name_style)
    header_role = Paragraph("Product designer", role_style)
    header_right = Paragraph(
        "Lagos, Nigeria<br/>+234 704 767 4577<br/>"
        '<link href="mailto:hello@mofi.design" color="#AD4E73">hello@mofi.design</link><br/>'
        '<link href="https://www.mofi.design" color="#AD4E73">mofi.design</link>',
        contact_style,
    )
    header = Table(
        [[header_name, header_right], [header_role, ""]],
        colWidths=[110 * mm, 52 * mm],
    )
    header.setStyle(TableStyle([
        ("SPAN", (1, 0), (1, 1)),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 1), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 1.5),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 0),
    ]))

    story = [
        header,
        Spacer(1, 18),
        HRFlowable(width="100%", thickness=0.8, color=rule, spaceBefore=0, spaceAfter=0),
        Spacer(1, 17),
        Paragraph("9 September 2026", date_style),
        Paragraph("Dear Instacart Design Team,", greeting_style),
        Paragraph(
            "The part of product design I enjoy most is making complicated, high-stakes "
            "systems feel dependable. That is what drew me to the Senior Product Designer II "
            "role on the Order Quality team. When an order does not go as expected, the "
            "experience has to do more than explain what happened - it has to help the "
            "customer recover quickly and rebuild trust.",
            body_style,
        ),
        Paragraph(
            "I have spent the past five-plus years designing complex products across fintech, "
            "insurance, AI, and enterprise SaaS. At Vurt, where I currently lead design, I "
            "redesigned the platform around a growing ecosystem of users and exchangers. At "
            "CyVi, I worked across connected experiences for customers, insurers, brokers, "
            "claims teams, and internal administrators. A checkout redesign I led reduced "
            "completion time by 70% and increased conversions by 40%.",
            body_style,
        ),
        Paragraph(
            "Those projects taught me how to balance the needs of several user groups without "
            "losing sight of the overall experience. I am comfortable moving from early "
            "research and problem framing into detailed flows, prototypes, polished UI, and "
            "implementation with product and engineering teams. I also use AI tools in my "
            "workflow to explore ideas and build prototypes faster, while keeping the final "
            "decisions grounded in user needs and product context.",
            body_style,
        ),
        Paragraph(
            "Instacart's Order Quality work is the kind of complex, measurable problem I would "
            "genuinely enjoy owning. I would be excited to bring my experience with multi-sided "
            "systems, transactional trust, and end-to-end product design to the Fulfillment team.",
            body_style,
        ),
        Spacer(1, 6),
        Paragraph(
            "Best,<br/><font color='#1E1B24'>Mofifoluwa Olawuyi</font><br/>"
            '<link href="https://www.mofi.design" color="#AD4E73">mofi.design</link><br/>'
            '<link href="mailto:hello@mofi.design" color="#AD4E73">hello@mofi.design</link>',
            signoff_style,
        ),
    ]

    doc.build(story, onFirstPage=background)


if __name__ == "__main__":
    build_pdf()
