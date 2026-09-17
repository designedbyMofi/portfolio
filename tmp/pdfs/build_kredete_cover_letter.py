from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


OUTPUT = "output/pdf/Mofifoluwa-Olawuyi-Kredete-Cover-Letter.pdf"


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
        title="Cover Letter - Product Designer at Kredete",
        author="Mofifoluwa Olawuyi",
        subject="Application for the Product Designer role at Kredete",
    )

    def background(pdf, _doc):
        pdf.saveState()
        pdf.setFillColor(canvas)
        pdf.rect(0, 0, A4[0], A4[1], stroke=0, fill=1)
        pdf.restoreState()

    name_style = ParagraphStyle(
        "Name", fontName="Fraunces", fontSize=22, leading=25,
        textColor=ink,
    )
    role_style = ParagraphStyle(
        "Role", fontName="Inter", fontSize=10.3, leading=14,
        textColor=muted,
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
        "Signoff", fontName="Inter", fontSize=10.2, leading=16,
        textColor=body,
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
        Paragraph("8 September 2026", date_style),
        Paragraph("Dear Kredete Team,", greeting_style),
        Paragraph(
            "I am a Lagos-based Product Designer with over five years of experience "
            "working across fintech, insurance, AI, and enterprise products. I also "
            "hold a BSc in Computer Science.", body_style,
        ),
        Paragraph(
            "What interests me most about this role is the opportunity to work on a fintech product. "
            "I have robust experience designing complex financial products and understand "
            "how important clarity, trust, and attention to detail are when people are "
            "managing their money.", body_style,
        ),
        Paragraph(
            "At Vurt, where I currently lead design, I redesigned the platform to support "
            "a growing ecosystem of users and exchangers. At CyVi, I designed experiences "
            "across customer, insurer, broker, and claims platforms. One checkout improvement "
            "I led reduced completion time by 70% and increased conversions by 40%.", body_style,
        ),
        Paragraph(
            "I enjoy understanding how complex systems work and turning them into products "
            "that feel simple and intuitive. I care about the entire experience - from "
            "research and early product flows to edge cases, polished interfaces, "
            "implementation, and learning from how the product performs after launch.", body_style,
        ),
        Paragraph(
            "Kredete is building the kind of financial infrastructure I would genuinely "
            "enjoy helping shape. My portfolio is available at "
            '<link href="https://www.mofi.design" color="#AD4E73"><u>mofi.design</u></link>.',
            body_style,
        ),
        Spacer(1, 6),
        Paragraph("Best,<br/><font color='#1E1B24'>Mofifoluwa Olawuyi</font>", signoff_style),
    ]

    doc.build(story, onFirstPage=background)


if __name__ == "__main__":
    build_pdf()
