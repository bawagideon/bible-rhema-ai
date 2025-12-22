"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChallengeTrackerProps {
    className?: string;
}

export function ChallengeTracker({ className }: ChallengeTrackerProps) {
    // Mock data for the challenge
    const currentDay = 3;
    const totalDays = 7;
    const progress = (currentDay / totalDays) * 100;

    return (
        <Card className={cn("flex flex-col justify-between", className)}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="font-serif text-lg text-primary">Prayer Challenge</CardTitle>
                    <Badge variant="secondary" className="font-normal text-xs">Day {currentDay} of {totalDays}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                <div className="p-4 rounded-md border border-border bg-muted/20 space-y-3">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Today's Task</span>
                    <div className="flex items-start space-x-3">
                        <Checkbox id="task1" className="mt-1" />
                        <div className="grid gap-1.5 leading-none">
                            <label
                                htmlFor="task1"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Intercede for a family member
                            </label>
                            <p className="text-xs text-muted-foreground">
                                Spend 5 minutes in focused prayer.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
