"""
PDF invoice generation using ReportLab.

This module creates professional-looking PDF invoices that include:
- Business header (from user profile)
- Client billing info
- Line items table
- Tax, discount, and total calculations
- Payment status
"""

import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
)


def generate_invoice_pdf(invoice):
    """
    Generate a PDF for the given invoice and return it as a BytesIO buffer.

    Args:
        invoice: Invoice model instance (with related items, payments, user, client)

    Returns:
        io.BytesIO: Buffer containing the PDF data
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    elements = []

    # Custom styles
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Title'],
        fontSize=28,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=6,
    )
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#475569'),
        spaceAfter=4,
    )
    normal_style = styles['Normal']

    # ── Header: INVOICE title + invoice number ──
    elements.append(Paragraph('INVOICE', title_style))
    elements.append(Paragraph(
        f'<b>{invoice.invoice_number}</b>', normal_style
    ))
    elements.append(Spacer(1, 12))

    # ── From / To section ──
    user = invoice.user
    client = invoice.client

    from_lines = [f'<b>From:</b>']
    if user.business_name:
        from_lines.append(user.business_name)
    if user.get_full_name():
        from_lines.append(user.get_full_name())
    if user.email:
        from_lines.append(user.email)
    if user.phone:
        from_lines.append(user.phone)
    if user.address:
        from_lines.append(user.address)

    to_lines = [f'<b>Bill To:</b>']
    to_lines.append(client.name)
    if client.company:
        to_lines.append(client.company)
    if client.email:
        to_lines.append(client.email)
    if client.phone:
        to_lines.append(client.phone)
    if client.address:
        to_lines.append(client.address)

    info_table = Table(
        [[
            Paragraph('<br/>'.join(from_lines), normal_style),
            Paragraph('<br/>'.join(to_lines), normal_style),
        ]],
        colWidths=[doc.width / 2] * 2,
    )
    info_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 12))

    # ── Dates and Status ──
    date_data = [
        ['Issue Date:', str(invoice.issue_date)],
        ['Due Date:', str(invoice.due_date)],
        ['Status:', invoice.get_status_display()],
    ]
    date_table = Table(date_data, colWidths=[80, 120])
    date_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#334155')),
    ]))
    elements.append(date_table)
    elements.append(Spacer(1, 20))

    # ── Line Items Table ──
    elements.append(Paragraph('Items', heading_style))

    items_header = ['#', 'Description', 'Qty', 'Unit Price', 'Total']
    items_data = [items_header]

    for i, item in enumerate(invoice.items.all(), 1):
        items_data.append([
            str(i),
            item.description,
            f'{item.quantity:g}',
            f'{item.unit_price:,.2f}',
            f'{item.total:,.2f}',
        ])

    items_table = Table(
        items_data,
        colWidths=[30, doc.width - 250, 50, 80, 80],
    )
    items_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        # Body rows
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        # Grid
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 16))

    # ── Totals ──
    totals_data = [
        ['Subtotal:', f'{invoice.subtotal:,.2f}'],
        [f'Tax ({invoice.tax_rate}%):', f'{invoice.tax_amount:,.2f}'],
    ]
    if invoice.discount > 0:
        totals_data.append(['Discount:', f'-{invoice.discount:,.2f}'])
    totals_data.append(['TOTAL:', f'{invoice.total:,.2f}'])

    # Amount paid and due
    amount_paid = invoice.amount_paid
    if amount_paid > 0:
        totals_data.append(['Amount Paid:', f'{amount_paid:,.2f}'])
        totals_data.append(['Amount Due:', f'{invoice.amount_due:,.2f}'])

    totals_table = Table(totals_data, colWidths=[120, 100], hAlign='RIGHT')
    totals_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        # Bold the TOTAL row
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 12),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.HexColor('#1e293b')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(totals_table)

    # ── Notes ──
    if invoice.notes:
        elements.append(Spacer(1, 20))
        elements.append(Paragraph('Notes', heading_style))
        elements.append(Paragraph(invoice.notes, normal_style))

    # ── Footer ──
    elements.append(Spacer(1, 40))
    footer_style = ParagraphStyle(
        'Footer',
        parent=normal_style,
        fontSize=8,
        textColor=colors.HexColor('#94a3b8'),
        alignment=1,  # Center
    )
    elements.append(Paragraph(
        'Generated by InvoiceHub — Thank you for your business!',
        footer_style,
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer
