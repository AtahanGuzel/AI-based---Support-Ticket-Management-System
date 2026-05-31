"use client"

import { SidebarNav } from "@/components/sidebar-nav"
import { ProtectedPage } from "@/components/protected-page"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Bell, Mail, Shield, User, Palette, Globe } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export default function SettingsPage() {
  const { user } = useAuth()
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}` || "U"
  const fullName = user ? `${user.firstName} ${user.lastName}` : "User"

  const roleLabelByRole: Record<string, string> = {
    employee: "Employee",
    agent: "Support Agent",
    admin: "Administrator",
  }
  
  const departmentByRole: Record<string, string> = {
    employee: "Business Operations",
    agent: "IT Support",
    admin: "IT Administration",
  }

  const roleLabel = user ? roleLabelByRole[user.role] : "User"
  const department = user ? departmentByRole[user.role] : "General"

  return (
    <ProtectedPage>
      <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 pl-64">
        <div className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30 flex items-center px-6">
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        </div>

        <div className="p-6 max-w-4xl">
          <div className="space-y-6">
            {/* Profile Section */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  Profile
                </CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg bg-primary/10 text-primary font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-foreground">{fullName}</h3>
                    <p className="text-sm text-muted-foreground">{roleLabel}</p>
                    <Button variant="link" className="h-auto p-0 text-sm text-primary">
                      Change avatar
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">First Name</label>
                      <Input defaultValue={user?.firstName ?? ""} className="rounded-lg border-border" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Last Name</label>
                      <Input defaultValue={user?.lastName ?? ""} className="rounded-lg border-border" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input defaultValue={user?.email ?? ""} type="email" className="rounded-lg border-border" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Department</label>
                    <Input defaultValue={department} className="rounded-lg border-border" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications Section */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  Notifications
                </CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-foreground">New Ticket Alerts</label>
                    <p className="text-xs text-muted-foreground">Get notified when new tickets are assigned to you</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-foreground">Customer Replies</label>
                    <p className="text-xs text-muted-foreground">Notify when customers respond to tickets</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-foreground">Email Notifications</label>
                    <p className="text-xs text-muted-foreground">Also send notifications via email</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            {/* AI Settings */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  AI Assistant
                </CardTitle>
                <CardDescription>Customize AI behavior and responses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-foreground">Auto-suggest Solutions</label>
                    <p className="text-xs text-muted-foreground">AI will suggest solutions based on similar tickets</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-foreground">Auto-create Tickets</label>
                    <p className="text-xs text-muted-foreground">Automatically create tickets when AI cannot resolve</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-foreground">Smart Priority Assignment</label>
                    <p className="text-xs text-muted-foreground">Let AI determine ticket priority based on content</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Security Section */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  Security
                </CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-foreground">Two-Factor Authentication</label>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700">
                    Enabled
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-foreground">Change Password</label>
                    <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-lg">
                    Update
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-foreground">Active Sessions</label>
                    <p className="text-xs text-muted-foreground">Manage devices where you&apos;re logged in</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-lg">
                    View All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
            <Button 
  className="rounded-lg shadow-md shadow-primary/25"
  onClick={() => toast.success("Settings saved")}
>
  Save Changes
</Button>
            </div>
          </div>
        </div>
      </main>
      </div>
    </ProtectedPage>
  )
}
