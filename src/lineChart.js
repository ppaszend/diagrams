import { zoom } from 'd3-zoom'

export default class LineChart {
  // Define class private properties
  #mouseVerticalLine
  #g_mouseDetailsInfoRectangle
  #mouseDetailsInfoText
  #mouseDetailsInfoRectangle

  lineData = []
  margin = {
    top: 10,
    left: 10,
    right: 10,
    bottom: 10
  }
  dimensions = {
    height: 400,
    width: 600,
    point: 2,
    pointsSpacing: 8
  }
  position = {
    x: 0,
    k: 1
  }

  /**
   * Create line chart
   * @param {Object} el - svg element where chart will be created (must be d3.js object)
   * @param {Array} param1.lineData - Data used to render {x: num, y: num}
   * @param {Object} param1.margin - free space between svg and chart {top: num, right: num, bottom: num, left: num}
   * @param {Object} param1.dimensions - dimensions of svg element {width: num, height: num, point: num}
   * @param {Boolean} param1.startFromZero - Should chart start from 0 or from minimal value
   */
  constructor(el, { lineData, margin, dimensions, startFromZero }) {
    if (typeof el !== "object") {
      console.error("'el' must be a d3.js object")
      return
    }
    this.el = el

    lineData && (this.lineData = lineData)
    margin && (this.margin = margin)
    dimensions && (this.dimensions = dimensions)
    startFromZero && (this.startFromZero = startFromZero)

    // Create group for chart
    this.g = this.el.append('g')
      .attr('class', 'chart')

    this.spacing = {
      top: margin.top + dimensions.point,
      bottom: margin.bottom + dimensions.point,
      left: margin.left + dimensions.point,
      right: margin.right + dimensions.point
    }

    this.mouseDetailsInfoRectangleDimensions = {
      width: 100,
      height: 50
    }

    this.#calculatePointsPosition()
    this.#initializeMouseVerticalLine()
    this.#intializeMouseDetailsHint()
    this.#initializeMouseEvents()

    this.render()
  }

  /**
   * Initialize vertical line attracted to nearest point
   */
  #initializeMouseVerticalLine() {
    this.#mouseVerticalLine = this.el.append('line')
      .attr('y1', 0)
      .attr('y2', this.el.node().getBoundingClientRect().height)
      .style('stroke', 'rgb(200, 200, 200)')
      .style('stroke-width', '2')
  }

  /**
   * Initialize mouse hint with x and y value
   * @returns {void}
   */
  #intializeMouseDetailsHint() {
    this.#g_mouseDetailsInfoRectangle = this.el.append('g')
      .style('visibility', 'hidden')

    this.#mouseDetailsInfoText = []

    for (let i = 0; i < 2; i++) {
      this.#mouseDetailsInfoText.push(this.#g_mouseDetailsInfoRectangle.append('text')
        .style('fill', '#FFFFFF')
        .attr('x', 10)
        .attr('y', i * 20 + 20)
      )
    }

    this.el.on('mousemove', e => {
      this.#g_mouseDetailsInfoRectangle.style('visibility', 'visible')
      this.#mouseVerticalLine.style('visibility', 'visible')
      const mouseBoundingClientRect = this.el.node().getBoundingClientRect()
      const mousePosition = {
        x: e.x - mouseBoundingClientRect.x,
        y: e.y - mouseBoundingClientRect.y
      }
      const nearestPoint = this.lineData.find(point => point.x === this.getNearestPoint(mousePosition.x - this.position.x))
      if (nearestPoint) {
        this.#mouseVerticalLine.attr('x1', this.p_x(nearestPoint.x) + this.position.x)
          .attr('x2', this.p_x(nearestPoint.x) + this.position.x)

        let mouseDetailsInfoRectangleXposition = mousePosition.x - this.mouseDetailsInfoRectangleDimensions.width - 3
        let mouseDetailsInfoRectangleYposition = mousePosition.y - this.mouseDetailsInfoRectangleDimensions.height - 3

        if (mousePosition.x < this.mouseDetailsInfoRectangleDimensions.width + 8) {
          mouseDetailsInfoRectangleXposition = mousePosition.x + 3
        }

        if (mousePosition.y < this.mouseDetailsInfoRectangleDimensions.height + 8) {
          mouseDetailsInfoRectangleYposition = mousePosition.y + 3
        }

        this.#g_mouseDetailsInfoRectangle.attr('transform', `translate(${mouseDetailsInfoRectangleXposition} ${mouseDetailsInfoRectangleYposition})`)
        this.#mouseDetailsInfoText[0].text(`x: ${nearestPoint.x}`)
        this.#mouseDetailsInfoText[1].text(`y: ${nearestPoint.y}`)
      }
    })

    this.#mouseDetailsInfoRectangle = this.#g_mouseDetailsInfoRectangle
      .append('rect')
      .attr('width', this.mouseDetailsInfoRectangleDimensions.width)
      .attr('height', this.mouseDetailsInfoRectangleDimensions.height)
      .style('fill', 'rgba(255, 255, 255, .2)')
      .attr('rx', '1')
      .attr('ry', '1')
  }

  /**
   * Initialize mouse events: zooming, panning
   * @returns {void}
   */
  #initializeMouseEvents() {
    // Listen to mouse events
    this.el.call(zoom().on("zoom", (e) => {
      this.#g_mouseDetailsInfoRectangle.style('visibility', 'hidden')
      let nearestPoint = this.getNearestPoint(e.sourceEvent.offsetX - this.position.x)

      this.changePosition({
        movX: e.sourceEvent.movementX,
        movZ: e.sourceEvent.deltaY
      })
      this.g.attr("transform", `translate(${this.position.x} ${0})`)

      // Only if zooming
      if (e.sourceEvent.deltaY) {
        this.changePosition({
          movX: 0 - this.p_x(nearestPoint) + (this.dimensions.width - this.spacing.left) / 2,
          movZ: false
        })
      }
    }))
  }

  /**
   * Calculate points position (pixels) from data
   * @returns {void}
   */
  #calculatePointsPosition() {
    const amplitude = this.dimensions.height - this.spacing.top - this.spacing.bottom

    // Difference between minimal and maximal point y coordinate
    const minValue = this.startFromZero ? 0 : Math.min(...this.lineData.map(point => point.y))

    // Scale data in order to use all graph height
    const scale = amplitude / ((Math.max(...this.lineData.map(point => point.y))) - minValue)

    this.points = this.lineData.map(pointData => ({
      x: pointData.x,
      y: amplitude - (pointData.y - minValue) * scale
    }))
  }

  /**
   * Get x point position (pixels)
   * @param {Number} x - X coordinate
   * @returns {Number} - X position
   */
  p_x(x) {
    return x * this.dimensions.pointsSpacing * this.position.k + this.spacing.left
  }

  /**
   * Get y point position (pixels)
   * @param {Number} y - Y coordinate
   * @returns {Number} - Y position
   */
  p_y(y) {
    return y + this.spacing.top
  }

  /**
   * Get nearest point by x coordinate
   * @param {Number} xCoordinate 
   */
  getNearestPoint(xCoordinate) {
    let pointX = Math.round((xCoordinate - this.spacing.left) / (this.dimensions.pointsSpacing * this.position.k))
    if (pointX < 0) {
      pointX = 0
    }
    return pointX
  }

  /**
   * Render graph
   * @param {Boolean} clear - clear previous render
   */
  render(clear = true) {
    if (clear) {
      this.el.selectAll(".chart").selectAll("*").remove()
    }

    // Create lines
    this.g.selectAll('.chart')
      .data(this.points.slice(0, -1))
      .join("line")
      .attr('x1', d => `${this.p_x(d.x)}px`)
      .attr('y1', d => `${this.p_y(d.y)}px`)
      .attr('x2', (d, i) => `${this.p_x(this.points[i + 1].x)}px`)
      .attr('y2', (d, i) => `${this.p_y(this.points[i + 1].y)}px`)
      .style('stroke', '#00848C')

    // Create points
    this.g.selectAll('.chart')
      .data(this.points)
      .join("circle")
      .attr("r", this.dimensions.point)
      .attr("cx", d => `${this.p_x(d.x)}px`)
      .attr("cy", d => `${this.p_y(d.y)}px`)
      .style('fill', '#F1F2F2')
  }

  /**
   * Change position of chart (zoom, moving)
   * Render is called automatically (with clearing)
   * @param {Number} param0.movX - Amount of pixels to move in X coordinate
   * @param {Number} param0.movZ - How many add to the scale
   */
  changePosition({ movX, movZ }) {
    const new_position = {
      x: this.position.x + movX,
      k: this.position.k - (movZ / 240)
    }

    if (movX) {
      if (new_position.x <= 0) {
        if (new_position.x >= 0 - (this.g.node().getBBox().width - (this.dimensions.width - this.margin.left - this.margin.right))) {
          this.position.x = new_position.x
        }
      }
    }

    if (movZ) {
      if (new_position.k >= 1) {
        this.position.k = new_position.k
      } else {
        this.position.k = 1
      }
      this.render()

      const maxXtranform = 0 - (this.g.node().getBBox().width - (this.dimensions.width - this.margin.left - this.margin.right))

      if (this.position.x < maxXtranform) {
        this.position.x = maxXtranform
      }
      this.render()
    }
  }
}