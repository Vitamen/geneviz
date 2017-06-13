
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
            selected_min: null,
            selected_max: null,
            rowCount: 1,
            columnCount: 300,
            useDynamicRowHeight: false,
            rowHeight: 20,
            list:Immutable.List(items),
        }

    //need to implement renderdatacell helper method
    this._cellRenderer = this._cellRenderer.bind(this)
    this._renderXAxisCell = this._renderXAxisCell.bind(this)
    this._getDatum = this._getDatum.bind(this)

    };

    

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
                cellRenderer = {this._cellRenderer}
                columnCount={columnCount}
                columnWidth={5}
                height={300}
                rowCount={rowCount}
                rowHeight={30}
                width={width}
              
                />
                )}
            </AutoSizer>

            );
     }

     _renderXAxisCell({columnIndex, key, rowIndex, style}) {
         console.log(key )

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
        // const millions =  Math.floor(datum / 1000000 % 10)
        // const tensMillions =  Math.floor(datum / 10000000 % 10)
        // const hundredMillions =  Math.floor(datum / 100000000 % 10)
        // const billions =  Math.floor(datum / 1000000000 % 10)


        // let label = "" //billions + "." + hundredMillions + tensMillions + millions

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
        // if ((columnIndex % 5) == 0 && (rowIndex == 0)) {
        //     label = billions + "." +  hundredMillions + "" + tensMillions  + "B"
        // }
        let label=""

        return (
            
            <div>
                className={classNames}
                key={key}
                style={style}>
                 
                 {label}
            </div>
           
        )
     }

    // _setGridRef(grid){
    //     this.axis = grid
    // }


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
