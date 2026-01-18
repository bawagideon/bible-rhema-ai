"use client";

import { useState, useEffect } from "react";
import { DailyRhemaCard } from "./daily-rhema-card";
import { NehemiahTimer } from "./nehemiah-timer";
import { EveningSacrifice } from "./evening-sacrifice";
import { motion, AnimatePresence } from "framer-motion";

type TimeBlock = 'morning' | 'day' | 'night';

export function HeroStream() {
    const [timeBlock, setTimeBlock] = useState<TimeBlock>('morning');

    useEffect(() => {
        const checkTime = () => {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 11) setTimeBlock('morning');
            else if (hour >= 11 && hour < 18) setTimeBlock('day');
            else setTimeBlock('night');
        };

        checkTime();
        // Check every minute just in case
        const interval = setInterval(checkTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // Helper for dev/demo purposes (optional, hidden in prod)
    // const setManualTime = (block: TimeBlock) => setTimeBlock(block);

    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                <motion.div
                    key={timeBlock}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                    {timeBlock === 'morning' && <DailyRhemaCard heroMode />}
                    {timeBlock === 'day' && <NehemiahTimer heroMode />}
                    {timeBlock === 'night' && <EveningSacrifice />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
