<template>
  <v-app>
    <v-main>
      <v-navigation-drawer
        style="padding: 15px"
        permanent
      >
        <div class="lyc_panel" >
          モード
          <v-btn-toggle class="lyc_panel_list" mandatory>
            <v-btn class="lyc_panel_button" icon="mdi-cursor-move" @click="onModeButtonClick('move')"></v-btn>
            <v-btn class="lyc_panel_button" icon="mdi-square-wave" @click="onModeButtonClick('connect')"></v-btn>
            <v-btn class="lyc_panel_button" icon="mdi-square-edit-outline" @click="onModeButtonClick('figure')"></v-btn>
          </v-btn-toggle>
        </div>
        <v-divider color="darkgrey" class="lyc_divider"></v-divider>
        <div class="lyc_panel" v-if="submenuList">
          <div v-for="(submenu, index) in submenuList" :key="index">
            <div>{{submenu.title}}</div>
            <v-btn-toggle mandatory>
              <v-btn v-for="item in submenu.items"
                     :key="item.id"
                     class="lyc_panel_button"
                     :icon="item.icon"
                     @click="onSubmenuButtonClick(item.id)"></v-btn>
            </v-btn-toggle>
          </div>
        </div>
        <div v-if="canvas">
          <v-divider color="darkgrey" class="lyc_divider"></v-divider>
          <div>オブジェクト数：{{canvasObjects.length}}</div>
          <div v-for="(obj, index) in canvasObjects" :key="index">
            {{obj.type}}：({{obj.left}}, {{obj.top}}, {{obj.width}}, {{obj.height}})：{{obj}}
          </div>
        </div>
      </v-navigation-drawer>
      <canvas
          id="canvas"
          width="700"
          height="700"
          class="lyc_canvas">
      </canvas>

    </v-main>
  </v-app>
</template>

<script>
import { fabric } from "fabric"
import { distPtSeg } from "@/GraphUtil";

fabric["SimpleConnector"] = fabric.util.createClass(fabric.Line, {
  type: "Connector",
  initialize(options) {
    const pts = [
      options.start.left,
      options.start.top,
      options.end.left,
      options.end.top
    ]
    this.callSuper("initialize", pts, options)
    this.start = options.start
    this.end = options.end
  },

  containsPoint(point) {
    const dist = distPtSeg(
        point.x, point.y,
        this.start.left, this.start.top,
        this.end.left, this.end.top,
    )
    return (dist <= 26)
  },

  render(ctx) {
    this.set({
      x1: this.start.left,
      y1: this.start.top,
      x2: this.end.left,
      y2: this.end.top,
    })
    this.callSuper("render", ctx)
  },
})

fabric["Connector"] = fabric.util.createClass(fabric.Group, {
  type: "Connector",
  initialize(options) {
    this.callSuper("initialize", options)

    this.start = options.start
    this.end = options.end
    this.points = []
    this.setupPolyline()
  },

  containsPoint(point) {
    for (let i=0 ; i<this.points.length - 1; i++) {
      const dist = distPtSeg(
          point.x, point.y,
          this.points[i].x, this.points[i].y,
          this.points[i+1].x, this.points[i+1].y
      )
      if (dist <= 26) return true
    }
    return false
  },

  render(ctx) {
    if (this.line) {
      this.callSuper("remove", this.line)
    }
    this.setupPolyline()
    this.callSuper("render", ctx)
  },

  setupPolyline() {
    this.points = this._makePoints(
        {x: this.start.left, y: this.start.top},
        {x: this.end.left, y: this.end.top}
    )

    this.line = new fabric.Polyline(this.points, {
      fill: null,
      stroke: "blue",
      strokeWidth: 2
    })

    this.callSuper("add", this.line)
  },
  _makePoints(ps, pt) {
    return [
      ps,
      {x: pt.x, y: ps.y},
      pt
    ]
  }
})


class CanvasContext {
  /**
   * @param parent
   * @param {fabric.Canvas} canvas
   */
  constructor(parent, canvas) {
    this.parent = parent
    this.canvas = canvas
  }

  active(elem) {
    if (elem) {
      this.canvas.setActiveObject(elem)
    } else {
      this.canvas.discardActiveObject()
    }
  }

  forEachObject(callback) {
    this.canvas.forEachObject(callback)
  }

  invalidate() {
    this.canvas.renderAll()
  }

  setupSubmenu(options) {
    this.parent.setupSubmenu(options)
  }

  remove(elem) {
    this.canvas.remove(elem)
  }

  removeIfSameLine(elem) {
    const isSameLine = this.canvas.getObjects("Connector")
        .filter(obj => elem !== obj)
        .filter(obj => {
          return (elem.start === obj.start && elem.end === obj.end) ||
              (elem.end === obj.start && elem.start === obj.end)
        })
    if (isSameLine && isSameLine.length !== 0) {
      this.remove(elem)
    }
  }

  /**
   *
   * @param {fabric.Object} elem
   * @private
   */
  _setupBoundingBox(elem) {
    elem.set({
      hasControls: false,
      padding: 5,
      borderColor: "red",
      borderDashArray: [3]
    })
  }

  _addFigure(Figure, options) {
    const elem = new Figure({
      originX: "center",
      originY: "center",
      fill: "white",
      stroke: "black",
      strokeWidth: 1,
      ...options
    })
    this._setupBoundingBox(elem)
    this.canvas.add(elem)
    return elem
  }

  addRect(x, y, size) {
    return this._addFigure(fabric.Rect,{
      left: x,
      top: y,
      width: size,
      height: size
    })
  }

  addCircle(x, y, radius) {
    return this._addFigure(fabric.Circle,{
      left: x,
      top: y,
      radius: radius
    })
  }

  addConnector(start, end) {
    console.log("addConnector", {start, end})
    return this._addFigure(fabric.Connector, {
      start: start,
      end: end
    })
  }
}

class CanvasHandler {

  // eslint-disable-next-line
  initialize(context) {
  }

  // eslint-disable-next-line
  release(context) {
  }

  // eslint-disable-next-line
  selectSubmenu(submenuId) {
  }

  // eslint-disable-next-line
  mouseMove(context, options) {
  }

  // eslint-disable-next-line
  mouseButtonDown(context, options) {
  }

  // eslint-disable-next-line
  mouseButtonUp(context, options) {
  }
}

/**
 * アイテムを選択する機能
 */
class ItemSelector extends CanvasHandler {

}

/**
 * 図形同士を接続線で繋げる機能
 */
class ItemConnector extends CanvasHandler {
  /**
   * @param {CanvasContext} context
   */
  initialize(context) {
    context.active(null)
    context.forEachObject(object => {
      object.set({
        selectable: false
      })
    })
  }

  release(context) {
    context.forEachObject(object => {
      object.set({
        selectable: true
      })
    })
  }

  mouseButtonDown(context, options) {
    if (options.target) {
      this.start = options.target
      this.cursor = {
        left: options.pointer.x,
        top: options.pointer.y
      }
      this.tempLine = context.addConnector(this.start, this.cursor)
    }
  }
  mouseMove(context, options) {
    if(this.tempLine) {
      this.tempLine.set({
        end: {
          left: options.pointer.x,
          top: options.pointer.y
        }
      })
      context.invalidate()
    }
  }

  /**
   *
   * @param {CanvasContext} context
   * @param options
   */
  mouseButtonUp(context, options) {
    // 視点でも今一時的に描画している線分自分でもないオブジェクトを特定する
    const hitObjects = context.canvas.getObjects()
        .filter(obj => obj !== this.tempLine && obj !== this.start)
        .filter(obj => obj.containsPoint(options.pointer))
    console.log("mouseButtonUp:hitObjects", {hitObjects})

    if (hitObjects) {
      const target = hitObjects[0]
      console.log("mouseButtonUp", target)

      this.tempLine.set({
        end: target
      })
      context.removeIfSameLine(this.tempLine)
    } else {
      context.remove(this.tempLine)
    }
    context.invalidate()

    this.start = null
    this.cursor = null
    this.tempLine = null

  }

}

/**
 * 図形を追加する機能
 */
class ItemAppender extends CanvasHandler {
  FIGURE_SIZE = 30
  figureAppender = () => {}

  initialize(context) {
    super.initialize(context)
    this.figureAppender = () => {}
    context.setupSubmenu([{
      title: "図形追加モード",
      items: [{
        id: 101,
        icon: "mdi-circle-outline"
      },{
        id: 102,
        icon: "mdi-square-outline"
      }]
    }])
  }

  // eslint-disable-next-line
  selectSubmenu(submenuId) {
    switch(submenuId) {
      case 101:
        this.figureAppender = (context, options) => {
          return context.addCircle(options.pointer.x, options.pointer.y, this.FIGURE_SIZE / 2)
        }
        break
      case 102:
        this.figureAppender = (context, options) => {
          return context.addRect(options.pointer.x, options.pointer.y, this.FIGURE_SIZE)
        }
        break
      default:
        this.figureAppender = () => {}
    }
  }

  // eslint-disable-next-line
  mouseButtonDown(context, options) {
    if (!options.target) {
      const elem = this.figureAppender(context, options)
      context.active(elem)
    }
  }
}

export default {
  name: 'App',
  data() {
    return {
      selectedMode: 2,
      selectedFigureCode: 1,
      handler: null,
      canvas: null,
      context: null,
      submenuList: null
    }
  },
  mounted() {
    this.canvas = new fabric.Canvas("canvas", {
      stopContextMenu: true,
      selection: false
    })

    this.canvas.on("mouse:move", this.onMouseMove)
    this.canvas.on("mouse:down", this.onMouseDown)
    this.canvas.on("mouse:up", this.onMouseUp)

    this.context = new CanvasContext(this, this.canvas)
    this.onModeButtonClick("move")
  },
  computed: {
    canvasObjects() {
      const objects = this.canvas.getObjects()
      return objects ? objects : []
    }
  },
  methods: {
    onMouseMove(options) {
      this.handler.mouseMove(this.context, options)
    },
    onMouseDown(options) {
      this.handler.mouseButtonDown(this.context, options)
    },
    onMouseUp(options) {
      this.handler.mouseButtonUp(this.context, options)
    },

    setupSubmenu(options) {
      this.submenuList = options
    },

    onModeButtonClick(mode) {
      let newHandler = null
      switch (mode) {
        case "move":
          newHandler = new ItemSelector()
          break
        case "connect":
          newHandler = new ItemConnector()
          break
        case "figure":
          newHandler = new ItemAppender()
          break
        default:
          return
      }
      this.handler && this.handler.release(this.context)
      this.submenuList = null
      newHandler.initialize(this.context)
      this.handler = newHandler

      console.log(this.canvas)
    },

    onSubmenuButtonClick(submenuId) {
      this.handler.selectSubmenu(submenuId)
    }
  }
}
</script>

<style scoped>

.lyc_divider {
  margin:20px;
}
.lyc_canvas {
  border: 1px solid darkblue;
  margin: 5px;
}
.lyc_panel {
  padding: 5px;
  border: 1px solid lightgray;
}
.lyc_panel_button {
  padding: 3px;
}
.lyc_panel_list {
  height: 100%;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

</style>
