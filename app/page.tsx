"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"

interface AnalysisConfig {
  AnalysisSPOT: {
    ID: string
    BaseMaterial: string
    OuterDiameterM: number
    WallThicknessM: number
    DesignPressureMPa: number
    DesignTemperatureC: number
  }
  Operational: {
    HistoryPath: string
    QualityFlags: string[]
    WindowHours: number
  }
  Refractory: {
    UseRefractory: boolean
    NominalThicknessIn: number
    Unit: "in" | "cm"
    PercentRemaining: number
    k: number
    hExt: number
    AmbientTempC: number
  }
  CreepModel: {
    AnalysisSTD: string
    MaterialAPI: string
    LMPType: "Minimum" | "Average"
    StressModel: "PressureOnly" | "FullStress"
    WeightStressKsi: number
  }
  Scenarios: {
    HorizonYears: number
    Future: {
      Name: string
      T_C: number
      P_kgcm2: number
      Active: boolean
    }[]
  }
  TrackingMode: number
}

const equipmentData = {
  "D-100-01": {
    BaseMaterial: "Low Carbon Steel",
    OuterDiameterM: 3.5433,
    WallThicknessM: 0.019,
    DesignPressureMPa: 0.345,
    DesignTemperatureC: 538,
    UseRefractory: true,
    ContextImage: "/images/ImgD100y101.jpg",
    DetailImage: "/images/ImgD100_Plenum.jpg",
  },
  "D-100-02": {
    BaseMaterial: "ASTM A240 304H",
    OuterDiameterM: 3.5433,
    WallThicknessM: 0.0127,
    DesignPressureMPa: 0.345,
    DesignTemperatureC: 538,
    UseRefractory: true,
    ContextImage: "/images/ImgD100y101.jpg",
    DetailImage: "/images/ImgD101_Top.jpg",
  },
  "D-100-03": {
    BaseMaterial: "Low Carbon Steel",
    OuterDiameterM: 3.5433,
    WallThicknessM: 0.0159,
    DesignPressureMPa: 0.345,
    DesignTemperatureC: 538,
    UseRefractory: true,
    ContextImage: "/images/ImgD100y101.jpg",
    DetailImage: "/images/ImgD100_Plenum.jpg",
  },
  "D-101-01": {
    BaseMaterial: "SA-387 Gr 11",
    OuterDiameterM: 2.743,
    WallThicknessM: 0.0127,
    DesignPressureMPa: 0.345,
    DesignTemperatureC: 482,
    UseRefractory: true,
    ContextImage: "/images/ImgD100y101.jpg",
    DetailImage: "/images/ImgD101_Top.jpg",
  },
  "L-101-01": {
    BaseMaterial: "ASTM A240 304H",
    OuterDiameterM: 0.273,
    WallThicknessM: 0.0048,
    DesignPressureMPa: 2.07,
    DesignTemperatureC: 565,
    UseRefractory: false,
    ContextImage: "/images/ImgD100y101.jpg",
    DetailImage: "/images/ImgD101_Top.jpg",
  },
}

const materialMapping: Record<string, string> = {
  "Low Carbon Steel": "Low Carbon Steel",
  "ASTM A240 304H": "Type 304 & 304H",
  "SA-387 Gr 11": "1.25Cr-0.5Mo",
}

const lmpCoefficients: Record<string, Record<string, Record<string, number>>> = {
  "Low Carbon Steel": {
    Minimum: { A0: 35093.2, A1: -3603.79, A2: 126.09, A3: -1.52, CLMP: 17.7 },
    Average: { A0: 37500.5, A1: -3850.2, A2: 135.4, A3: -1.65, CLMP: 17.7 },
  },
  "Type 304 & 304H": {
    Minimum: { A0: 33245.8, A1: -3421.15, A2: 119.56, A3: -1.44, CLMP: 18.2 },
    Average: { A0: 35680.3, A1: -3675.8, A2: 128.9, A3: -1.58, CLMP: 18.2 },
  },
  "1.25Cr-0.5Mo": {
    Minimum: { A0: 36789.4, A1: -3789.22, A2: 132.45, A3: -1.61, CLMP: 17.5 },
    Average: { A0: 39120.7, A1: -4025.6, A2: 141.2, A3: -1.73, CLMP: 17.5 },
  },
}

export default function CreepAnalysisConfig() {
  const [selectedEquipment, setSelectedEquipment] = useState<string>("")
  const [spotData, setSpotData] = useState(equipmentData["D-100-01"])

  const [historyPath, setHistoryPath] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [uploadError, setUploadError] = useState<string>("")
  const [qualityFlags, setQualityFlags] = useState<string[]>([])
  const [windowHours, setWindowHours] = useState<number>(24)

  const [useRefractory, setUseRefractory] = useState<boolean>(true)
  const [nominalThickness, setNominalThickness] = useState<number>(4.0)
  const [thicknessUnit, setThicknessUnit] = useState<"in" | "cm">("in")
  const [percentRemaining, setPercentRemaining] = useState<number>(70)
  const [thermalK, setThermalK] = useState<number>(0.5)
  const [hExt, setHExt] = useState<number>(10.0)
  const [ambientTemp, setAmbientTemp] = useState<number>(25)

  const [analysisSTD, setAnalysisSTD] = useState<string>("API 530")
  const [lmpType, setLMPType] = useState<"Minimum" | "Average">("Minimum")
  const [stressModel, setStressModel] = useState<"PressureOnly" | "FullStress">("PressureOnly")
  const [weightStress, setWeightStress] = useState<number>(0.0)

  const [horizonYears, setHorizonYears] = useState<number>(10)
  const [scenarios, setScenarios] = useState([
    { Name: "Promedio", T_C: 720.95, P_kgcm2: 2.05, Active: true },
    { Name: "Severo", T_C: 769.92, P_kgcm2: 2.09, Active: true },
    { Name: "Custom", T_C: 700, P_kgcm2: 2.0, Active: false },
  ])

  const [trackingMode, setTrackingMode] = useState<number>(0)

  const handleEquipmentChange = (equipmentId: string) => {
    setSelectedEquipment(equipmentId)
    const data = equipmentData[equipmentId as keyof typeof equipmentData]
    if (data) {
      setSpotData(data)
      setUseRefractory(data.UseRefractory)
    }
  }

  const handleQualityFlagToggle = (flag: string) => {
    setQualityFlags((prev) => (prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]))
  }

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file first")
      setUploadStatus("error")
      return
    }

    if (!selectedEquipment) {
      setUploadError("Please select equipment before uploading")
      setUploadStatus("error")
      return
    }

    setUploadStatus("uploading")
    setUploadError("")

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("equipmentID", selectedEquipment)

      const response = await fetch("/api/data/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Upload failed")
      }

      // Store the datasetId returned from Wolfram Cloud
      setHistoryPath(result.datasetId)
      setUploadStatus("success")
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed")
      setUploadStatus("error")
    }
  }

  const handleGenerateConfig = () => {
    const activeScenarios = scenarios.filter((s) => s.Active)

    const config: AnalysisConfig = {
      AnalysisSPOT: {
        ID: selectedEquipment || "D-100-01",
        BaseMaterial: spotData.BaseMaterial,
        OuterDiameterM: spotData.OuterDiameterM,
        WallThicknessM: spotData.WallThicknessM,
        DesignPressureMPa: spotData.DesignPressureMPa,
        DesignTemperatureC: spotData.DesignTemperatureC,
      },
      Operational: {
        HistoryPath: historyPath,
        QualityFlags: qualityFlags,
        WindowHours: windowHours,
      },
      Refractory: {
        UseRefractory: useRefractory,
        NominalThicknessIn: nominalThickness,
        Unit: thicknessUnit,
        PercentRemaining: percentRemaining,
        k: thermalK,
        hExt: hExt,
        AmbientTempC: ambientTemp,
      },
      CreepModel: {
        AnalysisSTD: analysisSTD,
        MaterialAPI: materialMapping[spotData.BaseMaterial] || spotData.BaseMaterial,
        LMPType: lmpType,
        StressModel: stressModel,
        WeightStressKsi: stressModel === "FullStress" ? weightStress : 0.0,
      },
      Scenarios: {
        HorizonYears: horizonYears,
        Future: activeScenarios,
      },
      TrackingMode: trackingMode,
    }

    console.log("[v0] Generated AnalysisConfig:")
    console.log(JSON.stringify(config, null, 2))
  }

  const downloadExcelTemplate = () => {
    if (!selectedEquipment) {
      alert("Please select equipment first")
      return
    }

    // Create a simple CSV that users can open in Excel
    const sheetName = `VariablesOpera_${selectedEquipment}`
    const csvContent = `Sheet Name: ${sheetName}

Date,Time,Temperature_C,Pressure_kgcm2,QualityFlag
2024-01-01,00:00:00,450.5,2.1,Good
2024-01-01,01:00:00,455.2,2.15,Good
2024-01-01,02:00:00,460.8,2.18,Good
2024-01-01,03:00:00,465.3,2.22,Good
2024-01-01,04:00:00,470.1,2.25,Good

Note: This template shows the required format.
- Create a sheet in your Excel file named exactly: ${sheetName}
- Include columns: Date, Time, Temperature (°C), Pressure (kg/cm²), QualityFlag
- Provide at least 2 rows of valid data
- Avoid quality flags: Bad, Failed, I/O Timeout, IO Timeout, Scan Off`

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `Template_${selectedEquipment}.csv`
    link.click()
  }

  const materialAPI = materialMapping[spotData.BaseMaterial] || spotData.BaseMaterial
  const lmpCoeffs = lmpCoefficients[materialAPI]?.[lmpType]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground">Creep Damage Assessment</h1>
            <p className="text-muted-foreground mt-2">Stage 1: Configuration Interface</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Powered by Knar Global</p>
          </div>
        </div>

        <Tabs defaultValue="tab1" className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-card border-2 border-border">
            <TabsTrigger
              value="tab1"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              1: Spot Analysis
            </TabsTrigger>
            <TabsTrigger
              value="tab2"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              2: Operational
            </TabsTrigger>
            <TabsTrigger
              value="tab3"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              3: Refractory
            </TabsTrigger>
            <TabsTrigger
              value="tab4"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              4: Creep Model
            </TabsTrigger>
            <TabsTrigger
              value="tab5"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              5: Scenarios
            </TabsTrigger>
            <TabsTrigger
              value="tab6"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              6: Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tab1" className="space-y-6">
            <Card className="bg-card text-card-foreground border-2 border-border">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">Equipment Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="equipment-id">Equipment ID</Label>
                  <Select value={selectedEquipment} onValueChange={handleEquipmentChange}>
                    <SelectTrigger
                      id="equipment-id"
                      className="bg-[#2d3748] border-2 border-border text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 hover:bg-[#374151]"
                    >
                      <SelectValue placeholder="Select equipment..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-2 border-border">
                      {Object.keys(equipmentData).map((id) => (
                        <SelectItem key={id} value={id}>
                          {id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedEquipment && (
                  <>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Base Material</Label>
                          <Input
                            value={spotData.BaseMaterial}
                            readOnly
                            className="bg-muted border-2 border-border text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Outer Diameter (m)</Label>
                          <Input
                            value={spotData.OuterDiameterM}
                            readOnly
                            className="bg-muted border-2 border-border text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Wall Thickness (m)</Label>
                          <Input
                            value={spotData.WallThicknessM}
                            readOnly
                            className="bg-muted border-2 border-border text-foreground"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Design Pressure (MPa)</Label>
                          <Input
                            value={spotData.DesignPressureMPa}
                            readOnly
                            className="bg-muted border-2 border-border text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Design Temperature (°C)</Label>
                          <Input
                            value={spotData.DesignTemperatureC}
                            readOnly
                            className="bg-muted border-2 border-border text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Use Refractory</Label>
                          <Input
                            value={spotData.UseRefractory ? "Yes" : "No"}
                            readOnly
                            className="bg-muted border-2 border-border text-foreground"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 mt-6">
                      <div className="space-y-2">
                        <Label>Context Image</Label>
                        <div className="relative h-64 bg-muted rounded-lg overflow-hidden border-2 border-border">
                          <Image
                            src={spotData.ContextImage || "/placeholder.svg"}
                            alt="Context"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Detail Image</Label>
                        <div className="relative h-64 bg-muted rounded-lg overflow-hidden border-2 border-border">
                          <Image
                            src={spotData.DetailImage || "/placeholder.svg"}
                            alt="Detail"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tab2" className="space-y-6">
            <Card className="bg-card text-card-foreground border-2 border-border">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">Operational Data Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="history-file">Temperature History File</Label>

                  {selectedEquipment && (
                    <div className="p-4 bg-card/50 border-2 border-primary/40 rounded-lg text-foreground text-sm space-y-3">
                      <p className="font-semibold text-primary flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Excel File Requirements:
                      </p>
                      <ul className="list-disc list-inside space-y-1.5 ml-2">
                        <li>
                          File must contain a sheet named:{" "}
                          <code className="bg-muted px-2 py-0.5 rounded text-primary font-mono text-xs">
                            VariablesOpera_{selectedEquipment}
                          </code>
                        </li>
                        <li>Required columns: Date, Time, Temperature (°C), Pressure (kg/cm²), QualityFlag</li>
                        <li>At least 2 valid data records required after quality filtering</li>
                        <li>Avoid quality flags: Bad, Failed, I/O Timeout, IO Timeout, Scan Off</li>
                      </ul>
                      <Button
                        onClick={downloadExcelTemplate}
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-muted border-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary"
                      >
                        Download Template Guide
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-3 items-stretch">
                    <label
                      htmlFor="history-file"
                      className={`bg-accent text-accent-foreground hover:bg-accent/90 px-6 py-2.5 rounded cursor-pointer inline-flex items-center justify-center font-medium text-base transition-colors ${
                        !selectedEquipment || uploadStatus === "uploading" ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Choose File
                    </label>
                    <input
                      id="history-file"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setSelectedFile(file)
                        setUploadStatus("idle")
                        setUploadError("")
                      }}
                      disabled={!selectedEquipment || uploadStatus === "uploading"}
                      className="hidden"
                    />
                    <div className="flex-1 bg-[#2d3748] border-2 border-border rounded px-4 py-2.5 flex items-center text-foreground">
                      {selectedFile ? selectedFile.name : "No file chosen"}
                    </div>
                    <Button
                      onClick={handleFileUpload}
                      disabled={!selectedFile || !selectedEquipment || uploadStatus === "uploading"}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] px-6 py-2.5 text-base font-medium"
                    >
                      {uploadStatus === "uploading" ? "Uploading..." : "Upload"}
                    </Button>
                  </div>

                  {!selectedEquipment && (
                    <p className="text-sm text-yellow-500">Please select equipment in Tab 1 before uploading</p>
                  )}

                  {selectedFile && uploadStatus === "idle" && (
                    <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>
                  )}

                  {uploadStatus === "success" && historyPath && (
                    <div className="p-3 bg-green-900/20 border border-green-600 rounded text-green-400 text-sm">
                      Upload successful! Dataset ID: {historyPath}
                    </div>
                  )}

                  {uploadStatus === "error" && uploadError && (
                    <div className="p-3 bg-red-900/20 border border-red-600 rounded text-red-400 text-sm">
                      <p className="font-semibold">Upload Failed:</p>
                      <p>{uploadError}</p>
                      {uploadError.includes("Upload failed") && (
                        <p className="mt-2 text-xs">
                          Common causes: Missing sheet "VariablesOpera_{selectedEquipment}", invalid data format, or
                          insufficient valid records.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Quality Flags to Exclude</Label>
                  <div className="space-y-2">
                    {["Bad", "Failed", "I/O Timeout", "IO Timeout", "Scan Off"].map((flag) => (
                      <div key={flag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`flag-${flag}`}
                          checked={qualityFlags.includes(flag)}
                          onCheckedChange={() => handleQualityFlagToggle(flag)}
                          className="border-2 border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                        />
                        <Label htmlFor={`flag-${flag}`} className="text-foreground cursor-pointer">
                          {flag}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="window-hours">Segment Duration</Label>
                  <Select value={String(windowHours)} onValueChange={(v) => setWindowHours(Number(v))}>
                    <SelectTrigger
                      id="window-hours"
                      className="bg-[#2d3748] border-2 border-border text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 hover:bg-[#374151]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-2 border-border">
                      <SelectItem value="24">24 h (1 day)</SelectItem>
                      <SelectItem value="48">48 h (2 days)</SelectItem>
                      <SelectItem value="72">72 h (3 days)</SelectItem>
                      <SelectItem value="96">96 h (4 days)</SelectItem>
                      <SelectItem value="120">120 h (5 days)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tab3" className="space-y-6">
            <Card className="bg-card text-card-foreground border-2 border-border">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">Refractory & Thermal Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use-refractory"
                    checked={useRefractory}
                    onCheckedChange={(checked) => setUseRefractory(checked as boolean)}
                    className="border-2 border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                  />
                  <Label htmlFor="use-refractory" className="text-foreground cursor-pointer font-semibold">
                    Use Refractory Lining
                  </Label>
                </div>

                {useRefractory && (
                  <div className="space-y-6 pl-6 border-l-2 border-accent">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nominal-thickness">Nominal Thickness</Label>
                        <div className="flex gap-2">
                          <Input
                            id="nominal-thickness"
                            type="number"
                            value={nominalThickness}
                            onChange={(e) => setNominalThickness(Number(e.target.value))}
                            className="bg-[#2d3748] border-2 border-border text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 hover:bg-[#374151]"
                          />
                          <Select value={thicknessUnit} onValueChange={(v) => setThicknessUnit(v as "in" | "cm")}>
                            <SelectTrigger className="w-24 bg-[#2d3748] border-2 border-border hover:bg-[#374151]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-2 border-border">
                              <SelectItem value="in">in</SelectItem>
                              <SelectItem value="cm">cm</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Refractory Remaining: {percentRemaining}%</Label>
                        <Slider
                          value={[percentRemaining]}
                          onValueChange={(v) => setPercentRemaining(v[0])}
                          min={0}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="thermal-k">Thermal Conductivity k (W/m·K)</Label>
                        <Input
                          id="thermal-k"
                          type="number"
                          step="0.01"
                          value={thermalK}
                          onChange={(e) => setThermalK(Number(e.target.value))}
                          className="bg-[#2d3748] border-2 border-border text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 hover:bg-[#374151]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="h-ext">External h (W/m²·K)</Label>
                        <Input
                          id="h-ext"
                          type="number"
                          value={hExt}
                          onChange={(e) => setHExt(Number(e.target.value))}
                          className="bg-[#2d3748] border-2 border-border text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 hover:bg-[#374151]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ambient-temp">Ambient Temp (°C)</Label>
                        <Input
                          id="ambient-temp"
                          type="number"
                          value={ambientTemp}
                          onChange={(e) => setAmbientTemp(Number(e.target.value))}
                          className="bg-[#2d3748] border-2 border-border text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 hover:bg-[#374151]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tab4" className="space-y-6">
            <Card className="bg-card text-card-foreground border-2 border-border">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">Creep & Stress Model Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="analysis-std">Reference Standard</Label>
                    <Select value={analysisSTD} onValueChange={setAnalysisSTD}>
                      <SelectTrigger
                        id="analysis-std"
                        className="bg-[#2d3748] border-2 border-border text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 hover:bg-[#374151]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-2 border-border">
                        <SelectItem value="API 530">API 530</SelectItem>
                        <SelectItem value="NIMS">NIMS</SelectItem>
                        <SelectItem value="ASME">ASME</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>API Creep Material</Label>
                    <Input value={materialAPI} readOnly className="bg-muted border-2 border-border text-foreground" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>LMP Type</Label>
                  <RadioGroup value={lmpType} onValueChange={(v) => setLMPType(v as "Minimum" | "Average")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Minimum" id="lmp-min" className="border-2 border-border" />
                      <Label htmlFor="lmp-min" className="cursor-pointer">
                        Minimum
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Average" id="lmp-avg" className="border-2 border-border" />
                      <Label htmlFor="lmp-avg" className="cursor-pointer">
                        Average
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Stress Model</Label>
                  <RadioGroup
                    value={stressModel}
                    onValueChange={(v) => setStressModel(v as "PressureOnly" | "FullStress")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="PressureOnly" id="stress-pressure" className="border-2 border-border" />
                      <Label htmlFor="stress-pressure" className="cursor-pointer">
                        Pressure-only cylinder
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="FullStress" id="stress-full" className="border-2 border-border" />
                      <Label htmlFor="stress-full" className="cursor-pointer">
                        Full stress state
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {stressModel === "FullStress" && (
                  <div className="space-y-2">
                    <Label htmlFor="weight-stress">Axial Weight Stress (ksi)</Label>
                    <Input
                      id="weight-stress"
                      type="number"
                      step="0.1"
                      value={weightStress}
                      onChange={(e) => setWeightStress(Number(e.target.value))}
                      className="bg-card border-2 border-border text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                )}

                {lmpCoeffs && (
                  <div className="mt-6 p-4 bg-muted border-2 border-border rounded-lg">
                    <h3 className="font-semibold text-foreground mb-3">LMP Coefficients ({lmpType})</h3>
                    <div className="grid grid-cols-3 gap-3 font-mono text-sm">
                      <div>A0: {lmpCoeffs.A0}</div>
                      <div>A1: {lmpCoeffs.A1}</div>
                      <div>A2: {lmpCoeffs.A2}</div>
                      <div>A3: {lmpCoeffs.A3}</div>
                      <div>CLMP: {lmpCoeffs.CLMP}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tab5" className="space-y-6">
            <Card className="bg-card text-card-foreground border-2 border-border">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">Future Scenarios & Projection Horizon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="horizon-years">Projection Horizon (years)</Label>
                  <Input
                    id="horizon-years"
                    type="number"
                    value={horizonYears}
                    onChange={(e) => setHorizonYears(Number(e.target.value))}
                    className="bg-card border-2 border-border text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 max-w-xs"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Operating Scenarios</Label>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-muted/50">
                        <TableHead className="text-foreground">Scenario Name</TableHead>
                        <TableHead className="text-foreground">Temperature (°C)</TableHead>
                        <TableHead className="text-foreground">Pressure (kg/cm²)</TableHead>
                        <TableHead className="text-foreground">Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scenarios.map((scenario, idx) => (
                        <TableRow key={idx} className="border-border hover:bg-muted/50">
                          <TableCell>
                            <Input
                              value={scenario.Name}
                              onChange={(e) => {
                                const newScenarios = [...scenarios]
                                newScenarios[idx].Name = e.target.value
                                setScenarios(newScenarios)
                              }}
                              className="bg-card border-2 border-border text-foreground focus:border-accent"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={scenario.T_C}
                              onChange={(e) => {
                                const newScenarios = [...scenarios]
                                newScenarios[idx].T_C = Number(e.target.value)
                                setScenarios(newScenarios)
                              }}
                              className="bg-card border-2 border-border text-foreground focus:border-accent"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={scenario.P_kgcm2}
                              onChange={(e) => {
                                const newScenarios = [...scenarios]
                                newScenarios[idx].P_kgcm2 = Number(e.target.value)
                                setScenarios(newScenarios)
                              }}
                              className="bg-card border-2 border-border text-foreground focus:border-accent"
                            />
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={scenario.Active}
                              onCheckedChange={(checked) => {
                                const newScenarios = [...scenarios]
                                newScenarios[idx].Active = checked as boolean
                                setScenarios(newScenarios)
                              }}
                              className="border-2 border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tab6" className="space-y-6">
            <Card className="bg-card text-card-foreground border-2 border-border">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">Analysis Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="tracking-mode">Tracking Mode (Audit Logging Depth)</Label>
                  <Select value={String(trackingMode)} onValueChange={(v) => setTrackingMode(Number(v))}>
                    <SelectTrigger
                      id="tracking-mode"
                      className="bg-[#2d3748] border-2 border-border text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 hover:bg-[#374151]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-2 border-border">
                      <SelectItem value="0">Level 0 - Minimal</SelectItem>
                      <SelectItem value="1">Level 1 - Standard</SelectItem>
                      <SelectItem value="2">Level 2 - Detailed</SelectItem>
                      <SelectItem value="3">Level 3 - Verbose</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-6 border-t-2 border-border">
                  <Button
                    onClick={handleGenerateConfig}
                    size="lg"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 border-2 border-accent font-semibold"
                  >
                    Generate Configuration Object
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Click to generate and log the AnalysisConfig object to console
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
