export const QUESTIONS = [
  {
    id: "transport",
    title: "🚗 Transportation",
    question: "How did you mostly get around today?",
    options: [
      { label: "Drove alone", value: "car_solo", co2: 5.0, notes: "~25 km round-trip in small car" },
      { label: "Carpooled", value: "carpool", co2: 2.5, notes: "~50% reduction" },
      { label: "Public transit", value: "transit", co2: 1.8, notes: "mixed bus/train average" },
      { label: "Biked or walked", value: "bike_walk", co2: 0.0, notes: "zero tailpipe" },
      { label: "Worked from home", value: "remote", co2: 0.2, notes: "small online energy use" },
    ],
  },
  {
    id: "energy",
    title: "💡 Energy Consumption",
    question: "How was your home energy use today?",
    options: [
      { label: "High – heating/cooling on all day", value: "high_use", co2: 3.0, notes: "heavy winter/summer use" },
      { label: "Moderate – typical day", value: "medium_use", co2: 2.0, notes: "average home energy use" },
      { label: "Low – efficient appliances, lights off", value: "low_use", co2: 1.0, notes: "conservation behavior" },
      { label: "Mostly renewable energy at home", value: "renewable", co2: 0.5, notes: "clean/green power plan" },
    ],
  },
  {
    id: "waste",
    title: "🗑️ Waste & Recycling",
    question: "How much waste did you recycle or compost today?",
    options: [
      { label: "Didn't recycle", value: "none", co2: 0, notes: "baseline" },
      { label: "Recycled some", value: "some", co2: -0.3, notes: "moderate reduction" },
      { label: "Recycled most / composted food", value: "most", co2: -0.6, notes: "good practice" },
      { label: "Avoided packaging entirely", value: "zero_waste", co2: -1.0, notes: "strong reduction" },
    ],
  },
  {
    id: "offset",
    title: "🌱 Conscious Choices / Offsets",
    question: "Did you take any low-carbon actions today?",
    options: [
      { label: "None", value: "none", co2: 0, notes: "baseline" },
      { label: "Used public transit / biked instead of driving", value: "alt_transport", co2: -1.0, notes: "offset" },
      { label: "Chose local or second-hand products", value: "sustainable_purchase", co2: -0.7, notes: "offset" },
      { label: "Offset or volunteered in green activity", value: "offset", co2: -1.5, notes: "strong offset" },
    ],
  },
];