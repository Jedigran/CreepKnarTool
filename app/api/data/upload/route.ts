import { type NextRequest, NextResponse } from "next/server"

const VALID_EQUIPMENT_IDS = ["D-100-01", "D-100-02", "D-100-03", "D-101-01", "L-101-01"]
const WOLFRAM_UPLOAD_ENDPOINT = "https://www.wolframcloud.com/obj/jorgegranada0/upload-history" // ← Fixed

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const equipmentID = formData.get("equipmentID") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    if (!equipmentID || !VALID_EQUIPMENT_IDS.includes(equipmentID)) {
      return NextResponse.json({ error: "Invalid or missing equipmentID" }, { status: 400 })
    }
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return NextResponse.json({ error: "Only Excel files (.xlsx, .xls) are supported" }, { status: 400 })
    }

    const wolframFormData = new FormData()
    wolframFormData.append("file", file)
    wolframFormData.append("equipmentID", equipmentID)

    console.log("[v0] Uploading to Wolfram Cloud:", { fileName: file.name, equipmentID })
    const wolframResponse = await fetch(WOLFRAM_UPLOAD_ENDPOINT, {
      method: "POST",
      body: wolframFormData,
    })

    if (!wolframResponse.ok) {
      const errorText = await wolframResponse.text()
      console.error("[v0] Wolfram Cloud HTTP error:", errorText)
      return NextResponse.json({ error: "Wolfram Cloud unreachable", details: errorText }, { status: 500 })
    }

    const result = await wolframResponse.json()
    console.log("[v0] Wolfram Cloud response:", result)

    // Explicit error handling
    if (result.error) {
      return NextResponse.json(
        { error: "Wolfram Cloud processing failed", details: result.error },
        { status: 400 }
      );
    }
    if (!result.datasetId) {
      return NextResponse.json(
        { error: "Invalid response from Wolfram Cloud - missing datasetId" },
        { status: 500 }
      );
    }

    return NextResponse.json({ datasetId: result.datasetId })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Internal server error during upload", details: String(error) }, { status: 500 })
  }
}
