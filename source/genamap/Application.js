
import Immutable from 'immutable'
import React, { PropTypes, PureComponent } from 'react'
import CustomWindowScroller from '../CustomWindowScroller'
import cn from 'classnames'
import styles from './genamap.css'
import axios from 'axios'
import d3 from 'd3'
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer'
import Grid from 'react-virtualized/dist/commonjs/Grid'
import TopAxis from './topaxis'

/*
TODO LIST
- Axis ( Make the major and minor axis
- Investegate css render delay problem
- Integrate into genamap
- Auto resize width
- Make it look prettier


 */
const colorRange = ["#990000", "#eeeeee", "#ffffff", "#eeeeee", "#000099"];

// zoomFactor: defines the aggregate factor for the cells
const zoomFactor = 100;
// maxZoom = (3088286401-1 / largestIndex^zoomFactor) > 0
// maxZoom: defines the total number of zoom levels
const maxZoom = 4;
const yAxisCellSize = 1;
let dataIndex = 0;


//TODO : Remove d3 deps
const calculateColorScale = (min, max, threshold) => {
    const mid = (min + max) / 2
    //find the range in which colors can be muted, as a percentage of data range
    const bound = (max - min) * threshold / 2
    return d3.scale.linear()
                  .domain([min, mid - bound, mid, mid + bound, max]) //this means that between mid +- bound, colors are muted
                  .range(colorRange)
} 


export default class Application extends PureComponent {
    //  static contextTypes = {
    //     list: PropTypes.instanceOf(Immutable.List).isRequired
    //  };

    constructor(props, context) {
        super(props, context)

        const zoominfo = {"start":1,"end":3088286401}
        let items = [];
        //Aggregating labels
        let factor = ((zoominfo.end - zoominfo.start) / zoomFactor);
        for (let i = zoominfo.start; i < (zoominfo.end); i = i + factor) {
            items.push(Math.floor(i));
        }
        this.state = {
            columnCount: zoomFactor,
            //height: 60,
            overscanColumnCount: 0,
            overscanRowCount: 0,
            rowHeight: 20,
            rowCount: 30,
            useDynamicRowHeight: false,
            list:Immutable.List(items),
            zoomindex:100,
            zoomamount: 0,
            zoomLevel: 0,
            zoomStack: [zoominfo],
            data:[],
            dataIndex: 0,
            lastFactor: factor,
            start: 1,
            end: 3088286401
        }

        this._cellRenderer = this._cellRenderer.bind(this)
        this._getColumnWidth = this._getColumnWidth.bind(this)
        // this._getRowClassName = this._getRowClassName.bind(this)
        // this._getRowHeight = this._getRowHeight.bind(this)
        this._onColumnCountChange = this._onColumnCountChange.bind(this)
        this._onRowCountChange = this._onRowCountChange.bind(this)
        this._onScrollToColumnChange = this._onScrollToColumnChange.bind(this)
        this._onScrollToRowChange = this._onScrollToRowChange.bind(this)
        this._renderXAxisCell = this._renderXAxisCell.bind(this)
        this._renderYAxisCell = this._renderYAxisCell.bind(this)
        this._renderDataCell = this._renderDataCell.bind(this)
        this._renderLeftSideCell = this._renderLeftSideCell.bind(this)
        this._getDatum = this._getDatum.bind(this)
        this.fetchData = this.fetchData.bind(this)
        this._dataInRange = this._dataInRange.bind(this)
        this._getDataIndex = this._getDataIndex.bind(this)
        this._updateDataIndex = this._updateDataIndex.bind(this)
        this._resetDataIndex = this._resetDataIndex.bind(this)
        this._setGridRef = this._setGridRef.bind(this)
        this._getYLabel = this._getYLabel.bind(this)
    }

    componentWillMount(){
        //TODO: Put into config
        this.fetchData(1,3088286401,zoomFactor)
    }

    fetchData(start,end,steps){
        //TODO: Put in config
        let url = "http://localhost:3001/data/?start=" + start + "&end=" + end + "&zoom=" + Math.floor((end-start)/steps)
        console.log(url)
        axios.get(url)
            .then((res) => {
                this.setState({ data: res.data },function(){
                       this.axis.forceUpdate()
                }.bind(this));
            });
    }

    render() {
        const {
            columnCount,
            height,
            overscanColumnCount,
            overscanRowCount,
            rowHeight,
            rowCount,
            scrollToColumn,
            scrollToRow,
            useDynamicRowHeight,
                    } = this.state
        
        let cursorPosition;
        if (this.state.zoomamount > 0) {
            cursorPosition =  Math.min(100, ((99 - (100*(this.state.zoomLevel / maxZoom))) -  (this.state.zoomamount*0.2))) + "%";
        } else {
            cursorPosition =  Math.max(0, (99 - (100*(this.state.zoomLevel / maxZoom))) -  (this.state.zoomamount*0.2)) + "%";
        }

        let zstack = this.state.zoomStack
                if (zstack.length > 1){
                    zstack.pop() 
                }

                let start = zstack[zstack.length - 1].start
                let end = zstack[zstack.length - 1].end
            
        return (
            <div>
                <div className={styles.zoomBar} >
                    <div className={styles.zoomBarCursorMarker} style={{top: 100 - (100*(4/maxZoom)) + "%"}}></div>
                    <div className={styles.zoomBarCursorMarker} style={{top: 100 - (100*(3/maxZoom)) + "%"}}></div>
                    <div className={styles.zoomBarCursorMarker} style={{top: 100 - (100*(2/maxZoom)) + "%"}}></div>
                    <div className={styles.zoomBarCursorMarker} style={{top: 100 - (100*(1/maxZoom)) + "%"}}></div>
                    <div className={styles.zoomBarCursor} style={{top: cursorPosition}}></div>
                </div>

                <div className={styles.topAxis}>
                    <TopAxis selected_min={this.state.start}
                             selected_max={this.state.end}
                    />
                  
                </div>
                <div className={styles.CustomWindowScrollerWrapper}>
                    <CustomWindowScroller onScroll={this._updateZoom.bind(this)}>
                        {({ height, isScrolling, scrollTop }) => (


                            <AutoSizer disableHeight>
                                {({width}) => (
                                    <Grid
                                        ref={this._setGridRef}
                                        cellRenderer={this._cellRenderer}
                                        columnWidth={this._getColumnWidth}
                                        columnCount={columnCount}
                                        height={height}
                                        width={width}
                                        overscanColumnCount={overscanColumnCount}
                                        overscanRowCount={overscanRowCount}
                                        rowHeight={
                                            ((height - 10) / rowCount)
                                        }
                                        rowCount={rowCount}
                                        scrollToColumn={scrollToColumn}
                                    />
                                )}
                            </AutoSizer>
                        )}
                    </CustomWindowScroller>
                </div>
            </div>
        )
    }

    _convertRemToPixels(rem) {    
        return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }

    _setRef (windowScroller) {
        this._windowScroller = windowScroller
    }

    _setGridRef(grid){
        this.axis = grid
    }

    _updateZoom({event, isScrolling}) {
        //console.log(event)
        if (isScrolling == false) this.setState({'zoomamount': 0})
        else {
            let zoomamt  = this.state.zoomamount + (event.wheelDeltaY / 10 )
            var current = this.state.hoveredColumnIndex //event.clientX / this._getColumnWidth()
            let zoomLevel = this.state.zoomLevel
            
            if (zoomLevel == 0 && zoomamt < 0) return;
            else if (zoomLevel == maxZoom && zoomamt > 0) return;
            
            if (zoomamt > 100) {
                dataIndex = 0; // reset data index for next redraw
                let start = this.state.list.get(Math.max(0, Math.floor(current) - 1))
                let end = this.state.list.get(Math.min(this.state.list.size-1, Math.floor(current) + 2))
  
  
                let factor = Math.floor((end - start) / zoomFactor);
                let items = [];

                if (factor > 0) {
                    for (let i = start; i < (end); i = i + factor) {
                        items.push(Math.floor(i));
                    }

                    const zstack = this.state.zoomStack
                    zstack.push({"start": start, "end": end})

                    this.setState({"list": Immutable.List(items), zoomStack: zstack, start: start, end: end,
                    zoomamount: 0, zoomLevel: this.state.zoomLevel + 1, data:[], lastFactor: factor}, function () {
                        this.fetchData(start,end,zoomFactor)

                        this._onColumnCountChange(items.length)
                        this.axis.recomputeGridSize({columnIndex: 0, rowIndex: 0})
                        this.axis.recomputeGridSize({columnIndex: 0, rowIndex: 1})
                        

                    }.bind(this))
                }
                
            } else if (zoomamt < -100){
                dataIndex = 0; // reset data index for next redraw

                // let c = this.state.zoomStack[this.state.zoomStack.length - 1]
                //     zstack.splice(this.state.zoomStack.length - 1,1)
                let zstack = this.state.zoomStack
                if (zstack.length > 1){
                    zstack.pop()


                    let start = zstack[zstack.length - 1].start
                    let end = zstack[zstack.length - 1].end

                    let factor = Math.max(1, Math.floor((end - start) / zoomFactor));
                    let items = [];

                    for (let i = start; i < (end); i = i + factor) {
                        items.push(Math.floor(i));
                    }

                    this.setState({"list": Immutable.List(items), zoomStack: zstack, 
                    zoomamount: 0, zoomLevel: this.state.zoomLevel - 1, start: start, end: end, data:[], lastFactor: factor}, function () {
                        this.fetchData(start,end,zoomFactor)
                        this._computeMajorAxisLabels(start,end,items.length)

                        this._onColumnCountChange(items.length)
                        this.axis.recomputeGridSize({columnIndex: 0, rowIndex: 0})
                        this.axis.recomputeGridSize({columnIndex: 1, rowIndex: 1})
                        this.axis.recomputeGridSize({columnIndex: 2, rowIndex: 0})
                        this.axis.recomputeGridSize({columnIndex: 3, rowIndex: 0})
                        this.axis.recomputeGridSize({columnIndex: 4, rowIndex: 0})
                        
                    }.bind(this))
                }
            }
            else {
                this.setState({'zoomamount': zoomamt})
            }


            // for (var i = 0; i < Math.floor(Math.random() * (10000 - 1000 + 1)) ; i++) {
            //     list.push(Math.floor(Math.random() * (10000 - 1 + 1)))
            // }
            //
            // console.log(list.length)
            // this.setState({"list":Immutable.List(list)},function(){
            //     this._onColumnCountChange({"target":{"value":(list.length)}});
            // }.bind(this))
            //We want to update data
            //this.axis.forceUpdate()
        }
        
        
        
    }


    _cellRenderer({columnIndex, key, rowIndex, style}) {
        
         if (rowIndex <= 1 && columnIndex > yAxisCellSize - 1) {
             columnIndex -= yAxisCellSize
             return this._renderXAxisCell({columnIndex, key, rowIndex, style})
         }

         if (columnIndex < yAxisCellSize && rowIndex > 1) {
             return this._renderYAxisCell({columnIndex, key, rowIndex, style})
         }

        columnIndex -= yAxisCellSize
        return this._renderDataCell({columnIndex, key, rowIndex, style})
    }

    _getColumnWidth(){
        return window.innerWidth / zoomFactor
    }

    _getDatum(index) {
        return this.state.list.get(index % this.state.list.size)
    }


    _getRowClassName(row) {
        return row % 2 === 0 ? styles.evenRow : styles.oddRow
    }
    //
    // _getRowHeight({index}) {
    //     return this._getDatum(index).bind(this).size
    // }



    _dataInRange(dataStart, dataEnd, axisIndex) {
        let axisStart = this.state.list.get(axisIndex);
        let axisEnd = axisStart + this.state.lastFactor;
        
        return (dataStart >= axisStart && dataEnd < axisEnd);
    }

    _getYLabel(rowIndex) { // TODO: Add reference to return a trait number from DB
        return rowIndex.toString()
    }

    _getDataIndex() {
        return this.state.dataIndex % (this.state.list.size - 1);
    }

    _updateDataIndex() { // async issues
        this.setState({dataIndex: this.state.dataIndex + 1}, function() {
            console.log(this.state.dataIndex)
        }.bind(this));
    }

    _resetDataIndex() {
        this.setState({dataIndex: 0});
    }

    _renderDataCell({columnIndex, key, rowIndex, style}) {

        let label = ""
        let color = ""
        if (this.state.data.length > 0){
        //     if (this.state.data[columnIndex]){
        //         label = this.state.data[columnIndex]["data"][rowIndex - 2]
        //     }
        //     if (this.state.data[columnIndex]) {
                
                let dataInRange = this._dataInRange(this.state.data[dataIndex]["start"], 
                                    this.state.data[dataIndex]["end"], columnIndex);
                if (dataInRange) {
                    label = this.state.data[dataIndex]["data"][rowIndex - 2];
                    dataIndex = (dataIndex + 1) % (this.state.data.length-yAxisCellSize);
                    let cellColorScale = calculateColorScale(0, 1, parseInt(label))
                    color = cellColorScale(label)
                } else {
                    label = 0;
                    //color = "#e0e0e0"
                }
        }
            

        // const rowClass = this._getRowClassName(rowIndex)
        // const classNames = cn(rowClass, styles.cell, {
        //     [styles.centeredCell]: columnIndex > 1
        // })



        var grid = this.axis


        var setState = this.setState.bind(this)
        var cname = styles.cell
        if (columnIndex == this.state.hoveredColumnIndex){
            color = "rgba(100, 0, 0, 0.25)"
            cname = styles.hoveredItem
        }

        style = {
            ...style,
            backgroundColor: color
        }


        return React.DOM.div({
            className: cname,
            key: key,
            onMouseOver: function () {
                setState({
                    hoveredColumnIndex: columnIndex,
                    hoveredRowIndex: rowIndex
                })
                if(grid){
                    grid.recomputeGridSize({columnIndex: columnIndex, rowIndex: rowIndex})
                }
            },
            style: style
        })


        // {label} to add number
        // return (
        //     <div
        //         className={classNames}
        //         key={key}
        //         style={style}
        //     >
        //     </div>
        // )
    }

    _renderXAxisCell({columnIndex, key, rowIndex, style}) {

        
        const rowClass = this._getRowClassName(rowIndex)
        const datum = this._getDatum(columnIndex)


        const classNames = cn(rowClass, styles.cell, {
            [styles.centeredCell]: columnIndex > 0
        })

        style = {
            ...style,
             //fontSize: "x-small",
        }

        //Format based on length of number
        const millions =  Math.floor(datum / 1000000 % 10)
        const tensMillions =  Math.floor(datum / 10000000 % 10)
        const hundredMillions =  Math.floor(datum / 100000000 % 10)
        const billions =  Math.floor(datum / 1000000000 % 10)


        //Compute the resolution for the scale
        let zstate = this.state.zoomStack[this.state.zoomStack.length - 1]


        let label = "" //billions + "." + hundredMillions + tensMillions + millions

        //Computer Major Axis Scale
        let scale = 1000 * 1000 * 1000 * 10 // 1 Billion
        let start = Math.floor(zstate.start / scale % 10)
        let end = Math.floor(zstate.end / scale % 10)

        while (start == end){
            scale = scale / 10
            start = Math.floor(zstate.start / scale % 10)
            end = Math.floor(zstate.end / scale % 10)
        }


        //Major Axis : Markers in Billions
        if ((columnIndex % 5) == 0 && (rowIndex == 0)) {
            label = billions + "." +  hundredMillions + "" + tensMillions  + "B"
        }

        
            //Minot Axis : Markers in Millions

        if (rowIndex == 1){
            label = ""
        }

        scale = scale /10

        if ((columnIndex % 5) > 0 && rowIndex == 1) {
            label = ""
        }else if (rowIndex == 1){
            label = "|"
        }

        if (label === NaN) {
            label = datum
        }

        return (
            <div
                className={classNames}
                key={key}
                style={style}
            >
                {label}
            </div>
        )
    }

    _renderYAxisCell({columnIndex, key, rowIndex, style}) {

        style = {
            ...style
        }

       let label = "" 

       if (columnIndex == 0) {
           label = this._getYLabel(rowIndex);
       }

        return (
            <div
                key={key}
                style={style}
            >
                {label}
            </div>
        )
    }

    _renderLeftSideCell({key, rowIndex, style}) {
        const datum = this._getDatum(rowIndex)

        const classNames = cn(styles.cell, styles.letterCell)

        // Don't modify styles.
        // These are frozen by React now (as of 16.0.0).
        // Since Grid caches and re-uses them, they aren't safe to modify.
        style = {
            ...style,
            backgroundColor: datum.color,
            cursor: "move"
        }

        return (
            <div
                className={classNames}
                key={key}
                style={style}
            >
                {datum}
            </div>
        )
    }

    _onColumnCountChange(columnCount) {
        //const columnCount = parseInt(event.target.value, 10) || 0
        this.setState({columnCount})
    }

    _onRowCountChange(event) {
        const rowCount = parseInt(event.target.value, 10) || 0
        this.setState({rowCount})
    }

    _onScrollToColumnChange(event) {
        const {columnCount} = this.state
        let scrollToColumn = Math.min(columnCount - 1, parseInt(event.target.value, 10))

        if (isNaN(scrollToColumn)) {
            scrollToColumn = undefined
        }

        this.setState({scrollToColumn})
    }

    _onScrollToRowChange(event) {
        const {rowCount} = this.state
        let scrollToRow = Math.min(rowCount - 1, parseInt(event.target.value, 10))

        if (isNaN(scrollToRow)) {
            scrollToRow = undefined
        }

        this.setState({scrollToRow})
    }

    _computeMajorAxisLabels(start,end,numberitems){
        //If next one is changing keep gap of 4//

        let items = []
        for (let i = start; i < (end); i = i + ((end - start) / zoomFactor)) {

            items.push(Math.floor(i));
        }
        items.push(end);
    }

}
