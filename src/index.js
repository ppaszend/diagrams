import lineChart from './lineChart'
import {select} from 'd3-selection'
import './style.scss'

const generateData = (amount, min = 0, max = 1000) => {
  const generated = []
  for (let i = 0; i < amount; i++) {
    generated.push({
      x: i,
      y: Math.floor(Math.random() * (max - min)) + min
    })
  }
  return generated
}

new lineChart(select('svg'), {
  lineData: generateData(200, 500, 5000),
  margin: {
    top: 10,
    left: 10,
    right: 10,
    bottom: 10
  },
  dimensions: {
    height: 400,
    width: 600,
    point: 2,
    pointsSpacing: 8
  }
})