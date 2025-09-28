/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Circle, Clock, MessageSquare, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/AuthContext"
import { supabase } from "@/lib/supabase"

interface ProgressStage {
  id: string
  title: string
  isDone: boolean
}

interface UpdateMessage {
  id: number
  date: string
  message: string
}

interface Project {
  created_at: string
  name: string
  status: string
  price: number
  available_shares: number
  location: string
  type: string
  image: string
  attributes: {
    sharePerNFT: number
    propertyType: string
    initialSharePrice: number
    initialPropertyValue: number
  }
  value_parameters: any
  id: string
  growth: string
  description: string
  progress?: ProgressStage[]
  updates?: UpdateMessage[]
}

const ProjectStatus = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Project | null>(null)
  const { user } = useAuth()
  const propertyId = window.location.pathname.split("/")[3]

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true)
      const { data: projectData, error } = await supabase.from("property_data").select("*").eq("id", propertyId)

      if (error) {
        alert("error")
      }

      if (projectData) {
        const project = projectData[0]
        if (!project.progress) {
          project.progress = getDefaultprogress(project.type)
        }
        if (!project.updates) {
          project.updates = getDefaultUpdates()
        }

        setData(project)
      }
      setLoading(false)
    }

    fetchProjects()
  }, [propertyId, user])

  // Generate default progress stages based on project type
  const getDefaultprogress = (projectType: string): ProgressStage[] => {
    const renewableStages = [
      { id: "stage1", title: "Site Assessment", isDone: true },
      { id: "stage2", title: "Environmental Permits", isDone: true },
      { id: "stage3", title: "Equipment Procurement", isDone: true },
      { id: "stage4", title: "Installation & Setup", isDone: false },
      { id: "stage5", title: "Grid Connection", isDone: false },
      { id: "stage6", title: "Testing & Commissioning", isDone: false },
      { id: "stage7", title: "Commercial Operation", isDone: false },
    ]

    const defaultStages = [
      { id: "stage1", title: "Planning & Design", isDone: true },
      { id: "stage2", title: "Permits & Approvals", isDone: true },
      { id: "stage3", title: "Foundation Work", isDone: true },
      { id: "stage4", title: "Construction", isDone: false },
      { id: "stage5", title: "Final Inspection", isDone: false },
      { id: "stage6", title: "Handover", isDone: false },
    ]

    return projectType === "Renewable" ? renewableStages : defaultStages
  }

  // Generate default updates
  const getDefaultUpdates = (): UpdateMessage[] => {
    return [
      {
        id: 123,
        date: "2024-01-13T10:00:00Z",
        message:
          "Equipment procurement phase completed successfully. All major components have been sourced and quality tested.",
      },
      {
        id: 121243,
        date: "2024-01-12T14:30:00Z",
        message: "Environmental impact assessment approved by regulatory authorities. Project cleared for next phase.",
      },
      {
        id: 124,
        date: "2024-01-10T09:15:00Z",
        message: "Site assessment completed. Soil conditions and environmental factors are optimal for the project.",
      },
      {
        id: 125,
        date: "2024-01-08T16:45:00Z",
        message: "Project officially launched. Initial site surveys and planning activities have commenced.",
      },
    ]
  }

  const getCompletedStages = () => {
    if (!data?.progress) return 0
    return data.progress.filter((stage) => stage.isDone).length
  }

  const getProgressPercentage = () => {
    if (!data?.progress) return 0
    return Math.round((getCompletedStages() / data.progress.length) * 100)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "launchpad":
        return "bg-blue-100 hover:bg-blue-200 text-blue-800"
      case "trading":
        return "bg-green-100 hover:bg-green-200 text-green-800"
      case "completed":
        return "bg-gray-100 hover:bg-gray-200 text-gray-800"
      default:
        return "bg-gray-100 hover:bg-gray-200 text-gray-800"
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
            <p className="text-gray-600">Unable to load project status information.</p>
            <Button onClick={() => navigate(-1)} variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-[90%] container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate(`/property/view/${propertyId}`)}
            variant="outline"
            className="mb-4 h-auto font-normal"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project Details
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Status</h1>
              <p className="text-xl text-gray-700 mb-2">{data.name}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{data.location}</span>
                <span>•</span>
                <span>{data.type}</span>
                <span>•</span>
                <Badge className={getStatusColor(data.status)}>
                  {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-medium text-gray-600">Current Price</p>
              <p className="text-2xl font-bold text-green-600">${data.price}</p>
              <p className="text-sm text-gray-600">{data.available_shares} shares available</p>
            </div>
          </div>
        </div>

        {/* Progress Overview Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Progress Overview</CardTitle>
              <Badge variant="secondary" className="text-sm">
                {getCompletedStages()} of {data.progress?.length || 0} completed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-medium text-gray-700">{getProgressPercentage()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>

            {/* Progress Stages */}
            <div className="space-y-4">
              {data.progress?.map((stage, index) => (
                <div key={stage.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {stage.isDone ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : index === getCompletedStages() ? (
                      <Clock className="w-6 h-6 text-blue-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-medium ${
                        stage.isDone
                          ? "text-green-700"
                          : index === getCompletedStages()
                            ? "text-blue-700"
                            : "text-gray-500"
                      }`}
                    >
                      {stage.title}
                    </h3>
                  </div>
                  <div className="flex-shrink-0">
                    {stage.isDone && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Completed
                      </Badge>
                    )}
                    {!stage.isDone && index === getCompletedStages() && (
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        In Progress
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Updates Timeline Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Project Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.updates?.map((update, index) => (
                <div key={update.id} className="relative">
                  {/* Timeline line */}
                  {index !== (data.updates?.length || 0) - 1 && (
                    <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-200"></div>
                  )}

                  <div className="flex space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">Project Update</p>
                        <p className="text-sm text-gray-500">{formatDate(update.date)}</p>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{update.message}</p>
                    </div>
                  </div>

                  {index !== (data.updates?.length || 0) - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProjectStatus
