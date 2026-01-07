import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { frequencyA, frequencyB, numPoints } = body

    // Validate inputs
    if (typeof frequencyA !== "number" || typeof frequencyB !== "number" || typeof numPoints !== "number") {
      return NextResponse.json({ error: "Invalid input parameters" }, { status: 400 })
    }

    const wolframUrl = new URL("https://www.wolframcloud.com/obj/jorgegranada0/sin-cos-plot-api")
    wolframUrl.searchParams.append("a", frequencyA.toString())
    wolframUrl.searchParams.append("b", frequencyB.toString())
    wolframUrl.searchParams.append("n", numPoints.toString())
    wolframUrl.searchParams.append("_format", "json")

    console.log("[v0] Calling Wolfram API:", wolframUrl.toString())

    const response = await fetch(wolframUrl.toString())

    if (!response.ok) {
      throw new Error(`Wolfram API returned ${response.status}`)
    }

    const responseText = await response.text()
    console.log("[v0] Wolfram response (first 200 chars):", responseText.substring(0, 200))

    let wolframData
    try {
      wolframData = JSON.parse(responseText)
      console.log("[v0] Successfully parsed as JSON")
    } catch {
      // If not JSON, parse the Wolfram Association format and evaluate symbolic expressions
      const xMatch = responseText.match(/"x"\s*->\s*\{([^}]+)\}/)
      const yMatch = responseText.match(/"y"\s*->\s*\{([^}]+)\}/)

      if (!xMatch || !yMatch) {
        throw new Error("Could not parse Wolfram response format")
      }

      const evaluateExpression = (expr: string): number => {
        const trimmed = expr.trim()
        // Replace Pi with its numeric value
        const withPi = trimmed.replace(/Pi/g, Math.PI.toString())
        try {
          // Use Function constructor to safely evaluate the expression
          return Number(new Function(`return ${withPi}`)())
        } catch {
          // Fallback to parseFloat if evaluation fails
          return Number.parseFloat(trimmed)
        }
      }

      const xVals = xMatch[1].split(",").map((v) => evaluateExpression(v))
      const yVals = yMatch[1].split(",").map((v) => evaluateExpression(v))

      wolframData = { x: xVals, y: yVals }
      console.log("[v0] Parsed symbolic format - first x:", xVals[0], "first y:", yVals[0])
    }

    console.log("[v0] Parsed data - x length:", wolframData.x?.length, "y length:", wolframData.y?.length)

    const data = wolframData.x.map((xVal: number, i: number) => ({
      x: xVal,
      y: wolframData.y[i],
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error generating plot:", error)
    return NextResponse.json({ error: "Failed to generate plot" }, { status: 500 })
  }
}
