
import Immutable from 'immutable'
import React from 'react'
import CustomWindowScroller from '../CustomWindowScroller'
import cn from 'classnames'
import styles from './genamap.css'
import axios from 'axios'
import d3 from 'd3'
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer'
import Grid from 'react-virtualized/dist/commonjs/Grid'



// const list = [[]];
// for (let i = 0; i <300; i = i+1) {
//             list[0][i] = i;
//         }

// function cellRenderer({ 
//     columnIndex, 
//     key,
//     rowIndex,
//     style}){
    

//     return (
//         <div
//         key = {key}
//         style = {style}
//         >
        
//         </div>
//     )
// }

export default class TopAxis extends React.PureComponent {


    constructor(props,context){
        super(props,context);
        const zoominfo = {"start":1,"end":3088286401}
        let items = [];
        //Aggregating labels
        for (let i =0; i < 300; i = i + 1) {
            items.push(Math.floor(i));
        }
        // const listNumbers = items.map((item) =>

        // <li key={item.toString()}>
        //     {item}
        // </li>
        // );
      
        this.state = {
            selected_min: props.selected_min,
            selected_max: props.selected_max,
            rowCount: 1,
            columnCount: 300,
            useDynamicRowHeight: false,
            rowHeight: 20,
            list:Immutable.List(items),
        }

    //need to implement renderdatacell helper method
    this._setGridRef = this._setGridRef.bind(this)
    this._cellRenderer = this._cellRenderer.bind(this)
    this._renderXAxisCell = this._renderXAxisCell.bind(this)
    this._getDatum = this._getDatum.bind(this)

};

    componentWillReceiveProps(nextProp) {
    
    this.setState({ selected_min: nextProp.selected_min, selected_max: nextProp.selected_max }, function(){
        for(let i=0; i<300; i++){
        this.axis.recomputeGridSize({columnIndex: i, rowIndex: 0})
    }
    }.bind(this)
        )


    
    }

    

    render() {
        const {
            columnCount,
            height,
            columnWidth,
            useDynamicRowHeight,
            rowHeight,
            rowCount,
        } = this.state

        

        return (
            <AutoSizer disableHeight>
                {({width}) => (

                <Grid
                ref={this._setGridRef}
                cellRenderer = {this._cellRenderer}
                columnCount={columnCount}
                columnWidth={5}
                height={30}
                rowCount={rowCount}
                rowHeight={30}
                width={width}
              
                />
                )}
            </AutoSizer>

            );
     }

     _renderXAxisCell({columnIndex, key, rowIndex, style}) {

        const rowClass = this._getRowClassName(rowIndex)
        let datum = this._getDatum(columnIndex)
        let min = this.state.selected_min
        let max = this.state.selected_max
        //console.log(datum * 10000000)

        const classNames = cn(rowClass, styles.cell, {
        [styles.centeredCell]: columnIndex > 0
         })
         //console.log(this.state.selected_min, this.state.selected_max)
         

        if(datum * 10000000 >= min && datum * 10000000 <= max ){
            style = {
                ...style,
                backgroundColor: "#0000FF"
            }
        }

        else if(max - min < 10000000 && Math.floor(min/10000000)==datum){
               style = {
                ...style,
                backgroundColor: "#0000FF"
            }
        }
        else{
           
            style = {
            ...style,
             //fontSize: "x-small",
            }
        }

        
        //Format based on length of number
        const millions =  Math.floor(datum / 1000000 % 10)
        const tensMillions =  Math.floor(datum / 10000000 % 10)
        const hundredMillions =  Math.floor(datum / 100000000 % 10)
        const billions =  Math.floor(datum / 1000000000 % 10)


        //let label = "" //billions + "." + hundredMillions + tensMillions + millions

        // //Computer Major Axis Scale
        // let scale = 1000 * 1000 * 1000 * 10 // 1 Billion
        // let start = Math.floor(zstate.start / scale % 10)
        // let end = Math.floor(zstate.end / scale % 10)

        // while (start == end){
        //     scale = scale / 10
        //     start = Math.floor(zstate.start / scale % 10)
        //     end = Math.floor(zstate.end / scale % 10)
    // }

        //Major Axis : Markers in Billions
        let label=""
       
        if ((columnIndex % 10) == 0 && (rowIndex == 0)) {
            let tM = Math.floor(columnIndex % 10).toString();
            let hM =  Math.floor(columnIndex / 10 % 10).toString();
            let B =  Math.floor(columnIndex / 100).toString();

        
            label = B +"." + hM + tM + "B"
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

    // _setGridRef(grid){
    //     this.axis = grid
    // }

    _setGridRef(grid){
        this.axis = grid
    }


     _cellRenderer({columnIndex, key, rowIndex, style}) {
          return this._renderXAxisCell({columnIndex, key, rowIndex, style})
     }

     _setGridRef(grid){
        this.axis = grid
    }

 
     _getRowClassName(row) {
        return row % 2 === 0 ? styles.evenRow : styles.oddRow
    }

    _getDatum(index) {
        return this.state.list.get(index % this.state.list.size)
    }
    


    

}
