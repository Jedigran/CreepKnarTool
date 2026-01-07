import { type NextRequest, NextResponse } from "next/server"

const VALID_EQUIPMENT_IDS = ["D-100-01", "D-100-02", "D-100-03", "D-101-01", "L-101-01"]
const WOLFRAM_UPLOAD_ENDPOINT = "https://www.wolframcloud.com/obj/jorgegranada0/upload-history"

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

    const urlWithParams = `${WOLFRAM_UPLOAD_ENDPOINT}?equipmentID=${encodeURIComponent(equipmentID)}`

    const wolframFormData = new FormData()
    wolframFormData.append("file", file)

    console.log("[v0] Uploading to Wolfram:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      equipmentID,
      endpoint: urlWithParams,
    })

    const wolframResponse = await fetch(urlWithParams, {
      method: "POST",
      body: wolframFormData,
    })

    const responseText = await wolframResponse.text()
    console.log("[v0] Wolfram response:", { status: wolframResponse.status, body: responseText.substring(0, 200) })

    if (!wolframResponse.ok) {
      if (responseText.includes("$Failed")) {
        return NextResponse.json(
          {
            error: "Excel file validation failed",
            details: `The Excel file must contain a sheet named "VariablesOpera_${equipmentID}" with columns: TimeSeries, Temperature, Pressure, QualityFlag, and at least 100 rows of data.`,
          },
          { status: 400 },
        )
      }
      return NextResponse.json(
        {
          error: "Wolfram Cloud processing failed",
          details: responseText,
          status: wolframResponse.status,
        },
        { status: 500 },
      )
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      if (responseText.includes("<|") && responseText.includes("|>")) {
        // Extract datasetId from Wolfram Association format
        const datasetIdMatch = responseText.match(/"datasetId"\s*->\s*"([^"]+)"/)
        const successMatch = responseText.match(/"Success"\s*->\s*(True|False)/)

        if (successMatch && successMatch[1] === "True" && datasetIdMatch) {
          result = { datasetId: datasetIdMatch[1] }
        } else {
          return NextResponse.json(
            { error: "Invalid response format from Wolfram", details: responseText },
            { status: 500 },
          )
        }
      } else if (responseText.startsWith("hist-")) {
        // If response is just a string like "hist-8a3f", wrap it
        result = { datasetId: responseText.trim() }
      } else {
        return NextResponse.json(
          { error: "Invalid response format from Wolfram", details: responseText },
          { status: 500 },
        )
      }
    }

    if (result.error) {
      return NextResponse.json({ error: "Wolfram Cloud error", details: result.error }, { status: 400 })
    }
    if (!result.datasetId) {
      return NextResponse.json({ error: "Invalid response from Wolfram Cloud - missing datasetId" }, { status: 500 })
    }

    return NextResponse.json({ datasetId: result.datasetId })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Internal server error during upload", details: String(error) }, { status: 500 })
  }
}
