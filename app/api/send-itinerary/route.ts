import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper: format ISO date string to readable date
function formatDate(dateString: string): string {
  const clean = dateString.replace(/Z$/, "");
  const date = new Date(clean);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Helper: format ISO datetime to time string
function formatTime(dateString: string): string {
  const timePart = dateString.includes("T")
    ? dateString.split("T")[1]
    : "00:00:00";
  const [hours, minutes] = timePart.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Helper: wrap text to fit within maxWidth
function wrapText(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

async function generateItineraryPDF(itinerary: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const violet = rgb(0.486, 0.231, 0.929);
  const darkText = rgb(0.12, 0.12, 0.12);
  const grayText = rgb(0.42, 0.42, 0.42);
  const lightGray = rgb(0.85, 0.85, 0.85);
  const violetLight = rgb(0.93, 0.9, 0.98);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  // ===== TITLE PAGE HEADER =====

  // Decorative top bar
  page.drawRectangle({
    x: 0,
    y: pageHeight - 8,
    width: pageWidth,
    height: 8,
    color: violet,
  });

  y = pageHeight - 70;

  // "TRAVEL ITINERARY" label
  page.drawText("TRAVEL ITINERARY", {
    x: margin,
    y,
    size: 11,
    font: boldFont,
    color: violet,
  });
  y -= 35;

  // Destination name
  page.drawText(itinerary.destination, {
    x: margin,
    y,
    size: 32,
    font: boldFont,
    color: darkText,
  });
  y -= 28;

  // Date range
  const dateRange = `${formatDate(itinerary.startDate)}  -  ${formatDate(itinerary.endDate)}`;
  page.drawText(dateRange, {
    x: margin,
    y,
    size: 12,
    font,
    color: grayText,
  });
  y -= 18;

  // Stats line
  const totalActivities =
    itinerary.days?.reduce(
      (sum: number, day: any) => sum + (day.activities?.length || 0),
      0
    ) || 0;
  const statsText = `${itinerary.days?.length || 0} Days  |  ${totalActivities} Activities`;
  page.drawText(statsText, {
    x: margin,
    y,
    size: 11,
    font,
    color: grayText,
  });
  y -= 15;

  // Interests
  if (itinerary.interests && itinerary.interests.length > 0) {
    const interestsText = `Interests: ${itinerary.interests.join(", ")}`;
    page.drawText(interestsText, {
      x: margin,
      y,
      size: 10,
      font: italicFont,
      color: grayText,
    });
    y -= 15;
  }

  // Divider line
  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 1,
    color: lightGray,
  });
  y -= 30;

  // ===== DAY-BY-DAY ITINERARY =====
  for (const day of itinerary.days || []) {
    ensureSpace(80);

    // Day header background
    page.drawRectangle({
      x: margin,
      y: y - 6,
      width: contentWidth,
      height: 30,
      color: violetLight,
      borderColor: violet,
      borderWidth: 0,
    });

    // Small violet accent bar on left
    page.drawRectangle({
      x: margin,
      y: y - 6,
      width: 4,
      height: 30,
      color: violet,
    });

    // Day title
    const dayTitle = `Day ${day.dayNumber}`;
    page.drawText(dayTitle, {
      x: margin + 14,
      y: y + 2,
      size: 14,
      font: boldFont,
      color: violet,
    });

    // Day date
    const dayDate = formatDate(day.date);
    const dayTitleWidth = boldFont.widthOfTextAtSize(dayTitle, 14);
    page.drawText(`  ${dayDate}`, {
      x: margin + 14 + dayTitleWidth + 4,
      y: y + 3,
      size: 11,
      font,
      color: grayText,
    });

    y -= 40;

    // Day notes
    if (day.notes) {
      ensureSpace(20);
      page.drawText(day.notes, {
        x: margin + 14,
        y,
        size: 10,
        font: italicFont,
        color: grayText,
      });
      y -= 18;
    }

    // Activities
    const activities = (day.activities || []).sort(
      (a: any, b: any) =>
        new Date(a.timeStart).getTime() - new Date(b.timeStart).getTime()
    );

    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      ensureSpace(80);

      const xContent = margin + 36;

      // Number circle
      const circleY = y + 4;
      page.drawCircle({
        x: margin + 16,
        y: circleY,
        size: 10,
        color: violet,
      });
      const numStr = `${i + 1}`;
      const numWidth = boldFont.widthOfTextAtSize(numStr, 9);
      page.drawText(numStr, {
        x: margin + 16 - numWidth / 2,
        y: circleY - 3.5,
        size: 9,
        font: boldFont,
        color: rgb(1, 1, 1),
      });

      // Connecting line to next activity
      if (i < activities.length - 1) {
        page.drawLine({
          start: { x: margin + 16, y: circleY - 11 },
          end: { x: margin + 16, y: circleY - 45 },
          thickness: 1.5,
          color: lightGray,
          dashArray: [3, 3],
        });
      }

      // Activity name
      page.drawText(activity.name, {
        x: xContent,
        y,
        size: 13,
        font: boldFont,
        color: darkText,
      });
      y -= 16;

      // Location
      page.drawText(`Location: ${activity.locationName}`, {
        x: xContent,
        y,
        size: 10,
        font,
        color: grayText,
      });
      y -= 14;

      // Time
      const timeStr = `${formatTime(activity.timeStart)} - ${formatTime(activity.timeEnd)}`;
      page.drawText(`Time: ${timeStr}`, {
        x: xContent,
        y,
        size: 10,
        font,
        color: grayText,
      });
      y -= 14;

      // Tags
      if (activity.tags && activity.tags.length > 0) {
        page.drawText(`Tags: ${activity.tags.join(", ")}`, {
          x: xContent,
          y,
          size: 9,
          font: italicFont,
          color: violet,
        });
        y -= 14;
      }

      // Description
      if (activity.description && activity.description !== "N/A") {
        const descLines = wrapText(
          activity.description,
          font,
          9.5,
          contentWidth - 50
        );
        for (const line of descLines) {
          ensureSpace(14);
          page.drawText(line, {
            x: xContent,
            y,
            size: 9.5,
            font,
            color: rgb(0.35, 0.35, 0.35),
          });
          y -= 13;
        }
      }

      y -= 16; // spacing between activities
    }

    y -= 14; // spacing between days
  }

  // ===== FOOTER ON LAST PAGE =====
  ensureSpace(50);
  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 0.5,
    color: lightGray,
  });
  y -= 20;
  page.drawText("Generated by Naviya - Your AI Travel Companion", {
    x: margin,
    y,
    size: 9,
    font: italicFont,
    color: grayText,
  });

  return await pdfDoc.save();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, itinerary } = body;

    if (!email || !itinerary) {
      return NextResponse.json(
        { error: "Email and itinerary data are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBytes = await generateItineraryPDF(itinerary);

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: "Naviya <onboarding@resend.dev>",
      to: email,
      subject: `Your ${itinerary.destination} Travel Itinerary`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #7c3aed; font-size: 28px; margin: 0;">Naviya</h1>
            <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Your AI Travel Companion</p>
          </div>
          <div style="background: linear-gradient(135deg, #f5f3ff, #ede9fe); border-radius: 16px; padding: 32px; margin-bottom: 24px;">
            <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 8px 0;">${itinerary.destination}</h2>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0;">
              ${formatDate(itinerary.startDate)} - ${formatDate(itinerary.endDate)}
            </p>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0;">
              Your personalized travel itinerary is attached as a PDF. 
              It includes ${itinerary.days?.length || 0} days of carefully planned activities and recommendations.
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            This itinerary was generated by Naviya. Have a wonderful trip!
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `${itinerary.destination.replace(/[^a-zA-Z0-9]/g, "-")}-itinerary.pdf`,
          content: Buffer.from(pdfBytes).toString("base64"),
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Itinerary sent to ${email}`,
      emailId: data?.id,
    });
  } catch (err: any) {
    console.error("Send itinerary error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
