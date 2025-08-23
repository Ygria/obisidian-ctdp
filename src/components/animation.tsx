import timer from "../assets/timer.json"
import whistle from "../assets/whistle.json"
import workout from '../assets/workout.json'
import building from '../assets/building.json'
import swap from "../assets/swap.json"
import brokenChain from '../assets/broken-chain.json'
import archy from "../assets/archy.json"
import dumbell from "../assets/dumbell.json"
import reading from "../assets/reading.json"
import confetti from "../assets/Confetti.json"
import trophy from "../assets/Trophy.json"
import Lottie from "lottie-react"



export const ANIMATION_DATA = {

    "building": {
        data: building,
        code: 'building',
        name: '默认'
    },
    "confetti": {
        data: confetti,
        code: 'confetti'
    },
    "trophy": {
        data: trophy,
        code: 'trophy'
    },
    "timer": {
        data: timer,
        code: 'timer',

    },
    "whistle": {
        data: whistle,
        code: 'whistle',
        name: '冲刺'
    },
    "workout": {
        data: workout,
        code: 'workout',
        name: '锻炼'
    },
    "reading": {
        data: reading,
        code: 'reading',
        name: '阅读'
    },

    "swap": {
        data: swap,
        code: 'swap',
        name: '清扫'
    },
    "archy": {

        data: archy,
        code: 'archy',
        name: "射靶"
    },
    'dumbell': {
        data: dumbell,
        code: 'dumbell',
        name: "举铁"
    },
    'broken-chain': {
        data: brokenChain,
        code: 'broken-chain',

    },

}

interface AnimationProps {
    name: string
}

export const Animation = ({ name }: AnimationProps) => {
    return <>

        <Lottie animationData={ANIMATION_DATA[name]?.data} />
    </>
}