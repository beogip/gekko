// This is a basic example strategy for Gekko.
// For more information on everything please refer
// to this document:
//
// https://gekko.wizb.it/docs/strategies/creating_a_strategy.html
//
// The example below is pretty bad investment advice: on every new candle there is
// a 10% chance it will recommend to change your position (to either
// long or short).

var log = require('../core/log');

// Let's create our own strat
var strat = {};

// Prepare everything our method needs
strat.init = function() {
  this.input = 'candle';
  this.requiredHistory = this.tradingAdvisor.historySize
  this.percentageSinceBreak = this.settings.percentageSinceBreak
  this.maxTrades = 4
  this.history = []
  this.trades = []
  this.length = 24
  this.min = null
  this.profit = 0

}

// What happens on every new candle?
strat.update = function(candle) {
  if(!this.min) this.min = candle.close

  this.history.push(candle.close)
  this.history = this.history.splice(-this.length)
  for (let i = 0; i < this.history.length - 3; i++) {

    if(this.history[i+3]/this.history[i] > 1.08){
      this.min = this.history[i]
    }
  }
}

// For debugging purposes.
strat.log = function() {

}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function(candle) {

  if(this.currentTrend !== 'long' && candle.close / this.min < this.percentageSinceBreak) {
    this.advice('long')
    this.currentTrend = 'long'
    this.targetPrice = this.min
    this.lastStart = candle.start
    this.buyPrice = candle.close
  }

  if(this.currentTrend === 'long' && (this.targetPrice <= candle.close /*|| this.lastStart && candle.close / this.buyPrice >= 1.05 && candle.start.diff(this.lastStart, 'hours') >= 12*/)) {
    this.advice('short')
    this.currentTrend = 'short'
  }

}

strat.itBreaksPoint = function (currentPoint, point) {
  return currentPoint / point < this.percentageSinceBreak
}

strat.openTrade = function(candle) {

  if(!this.itBreaksPoint(candle.close, this.min ) ||
    this.trades.length && !this.itBreaksPoint(candle.close, this.trades[this.trades.length - 1].buyPrice) ||
    this.trades.length >= this.maxTrades) return

  this.trades.push({
    targetPrice: this.min,
    lastStart: candle.start,
    buyPrice: candle.close,
  })
  this.advice('long')
  console.log(candle)
}

strat.closeTrades = function(candle) {
  this.trades.forEach((t, index, trades) => {
    if (t.targetPrice > candle.close) return


    this.advice('short')
    trades.splice(index, 1)
  })
}

strat.check2 = function(candle) {

  this.openTrade(candle)
  this.closeTrades(candle)

}
module.exports = strat;
