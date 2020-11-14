import { dsvFormat } from 'd3'
import {zoom} from 'd3-zoom'

const lineChart = (el, { lineData, margin, dimensions, startFromZero }) => {
  // include point dimensions in margins
  const spacing = {
    top: margin.top + dimensions.point,
    bottom: margin.bottom + dimensions.point,
    left: margin.left + dimensions.point,
    right: margin.right + dimensions.point
  }

  const minValue = startFromZero ? 0 : Math.min(...lineData.map(point => point.y))

  // Difference between minimal and maximal point y coordinate
  const amplitude = dimensions.height - spacing.top - spacing.bottom

  // Scale data in order to use all graph height
  const scale = amplitude / ((Math.max(...lineData.map(point => point.y))) - minValue)

  const points = lineData.map(pointData => ({
    x: pointData.x,
    y: amplitude - (pointData.y - minValue) * scale
  }))

  let g

  // Store position of chart (for zooming and panning)
  let position = {
    x: 0,
    y: 0,
    k: 1
  }

  // Functions for calculate point position
  const p_x = x => x * dimensions.pointsSpacing * position.k + spacing.left
  const p_y = y => y + spacing.top

  // Get nearest point by x position
  const getNearestPoint = xCoordinate => {
    let pointX = Math.round((xCoordinate - spacing.left) / (dimensions.pointsSpacing * position.k))
    if (pointX < 0) pointX = 0
    return pointX
  }

  // Create group for chart
  g = el.append('g')
    .attr('class', 'chart')

  // render scaled graph
  const render = (clear = true) => {
    if (clear) {
      el.selectAll(".chart").selectAll("*").remove()
    }

    // Create lines
    g.selectAll('.chart')
      .data(points.slice(0, -1))
      .join("line")
      .attr('x1', d => `${p_x(d.x)}px`)
      .attr('y1', d => `${p_y(d.y)}px`)
      .attr('x2', (d, i) => `${p_x(points[i + 1].x)}px`)
      .attr('y2', (d, i) => `${p_y(points[i + 1].y)}px`)
      .style('stroke', '#00848C')

    // Create points
    g.selectAll('.chart')
      .data(points)
      .join("circle")
      .attr("r", dimensions.point)
      .attr("cx", d => `${p_x(d.x)}px`)
      .attr("cy", d => `${p_y(d.y)}px`)
      .style('fill', '#F1F2F2')
  }

  // Initial render
  render()

  // Get dimensions of rendered chart
  const g_dimensions = g.node().getBBox()

  // Function for change position of chart (zooming, panning)
  const changePosition = ({ movX, movY, movZ }) => {
    const new_position = {
      x: position.x + movX,
      y: position.y + movY,
      k: position.k - (movZ / 240)
    }

    if (movX) {
      if (new_position.x <= 0) {
        if (new_position.x >= 0 - (g.node().getBBox().width - (dimensions.width - margin.left - margin.right))) {
          position.x = new_position.x
        }
      }
    }

    // if (movY) {
    //   if (new_position.y <= 0 && new_position.y >= 0 - (scaled_g_dimensions(position.k).height - (dimensions.height - (margin.top + margin.bottom) * position.k))) {
    //     position.y = new_position.y
    //   }
    // }

    if (movZ) {
      if (new_position.k >= 1) {
        position.k = new_position.k
      } else {
        position.k = 1
      }
      render()

      const maxXtranform = 0 - (g.node().getBBox().width - (dimensions.width - margin.left - margin.right))

      if (position.x < (maxXtranform)) {
        position.x = (maxXtranform)
      }
      render()
    }
  }

  // Listen to mouse events
  el.call(zoom().on("zoom", (e) => {
    g_mouseDetailsInfoRectangle.style('visibility', 'hidden')
    mouseVerticalLine.style('visibility', 'hidden')
    changePosition({
      movX: e.sourceEvent.movementX,
      movZ: e.sourceEvent.deltaY
    })
    g.attr("transform", `translate(${position.x} ${0})`)
  }))

  const mouseVerticalLine = el.append('line')
    .attr('y1', 0)
    .attr('y2', el.node().getBoundingClientRect().height)
    .style('stroke', 'rgb(200, 200, 200)')
    .style('stroke-width', '2')

  const mouseDetailsInfoRectangleDimensions = {
    width: 100,
    height: 50
  }

  const g_mouseDetailsInfoRectangle = el.append('g')
    .style('visibility', 'hidden')

  const mouseDetailsInfoRectangle = g_mouseDetailsInfoRectangle
    .append('rect')
    .attr('width', mouseDetailsInfoRectangleDimensions.width)
    .attr('height', mouseDetailsInfoRectangleDimensions.height)
    .style('fill', 'rgba(255, 255, 255, .2)')
    .attr('rx', '1')
    .attr('ry', '1')

  const mouseDetailsInfoText = []

  for (let i = 0; i < 2; i++) {
    mouseDetailsInfoText.push(g_mouseDetailsInfoRectangle.append('text')
      .style('fill', '#FFFFFF')
      .attr('x', 10)
      .attr('y', i * 20 + 20)
    )
  }

  el.on('mousemove', e => {
    g_mouseDetailsInfoRectangle.style('visibility', 'visible')
    mouseVerticalLine.style('visibility', 'visible')
    const mouseBoundingClientRect = el.node().getBoundingClientRect()
    const mousePosition = {
      x: e.x - mouseBoundingClientRect.x,
      y: e.y - mouseBoundingClientRect.y
    }
    const nearestPoint = lineData.find(point => point.x === getNearestPoint(mousePosition.x - position.x))
    if (nearestPoint) {
      mouseVerticalLine.attr('x1', p_x(nearestPoint.x) + position.x)
        .attr('x2', p_x(nearestPoint.x) + position.x)

      let mouseDetailsInfoRectangleXposition = mousePosition.x - mouseDetailsInfoRectangleDimensions.width - 3
      let mouseDetailsInfoRectangleYposition = mousePosition.y - mouseDetailsInfoRectangleDimensions.height - 3

      if (mousePosition.x < mouseDetailsInfoRectangleDimensions.width + 8) {
        mouseDetailsInfoRectangleXposition = mousePosition.x + 3
      }

      if (mousePosition.y < mouseDetailsInfoRectangleDimensions.height + 8) {
        mouseDetailsInfoRectangleYposition = mousePosition.y + 3
      }

      g_mouseDetailsInfoRectangle.attr('transform', `translate(${mouseDetailsInfoRectangleXposition} ${mouseDetailsInfoRectangleYposition})`)
      mouseDetailsInfoText[0].text(`x: ${nearestPoint.x}`)
      mouseDetailsInfoText[1].text(`y: ${nearestPoint.y}`)
    }
  })

  el.on('mouseleave', () => {
    g_mouseDetailsInfoRectangle.style('visibility', 'hidden')
    mouseVerticalLine.style('visibility', 'hidden')
  })

  el.on('mouseenter', () => {
    g_mouseDetailsInfoRectangle.style('visibility', 'visible')
    mouseVerticalLine.style('visibility', 'visible')
  })
}

export default lineChart