import Utils from "./../../libs/utils.js";
import * as consts from "./../../consts/consts.js";

class AllocationComponent extends HTMLElement {
    componentParams = {
      allocated: 0,
      distributed: 0,
      available: 0,
      locked: 0,
      total: 0,
      totalStr: '0',
      lockedStr: '0',
      allocatedStr: '0',
      distributedStr: '0',
      availableStr: '0',
      remaining: 0,
      vestingStart: 0,
      vestingEnd: 0,
      availGraph: 0,
      lockedGraph: 0,
      distrGraph: 0,
      vestingStartDate: '',
      vestingEndDate: '',
      currentHeight: 0
    }

    constructor() {
      super();
    }

    getTemplate() {
      const TEMPLATE =
      `<div class="allocation">
          <div class="container__header">INVESTOR ALLOCATION</div>
          <div class="container__content">
            <div class="container__content__vesting">
                <div class="container__content__vesting__vested">
                    <div class="allocation-title">Total vested</div>
                    <div class="vested-value">
                        ${Utils.numberWithCommas(this.componentParams.totalStr)} BEAMX
                    </div>
                </div>
                <div class="vesting">
                    <div class="vesting__start">
                        <div class="vesting-title">VESTING START</div>
                        <div class="vesting__start__info">
                            <div class="vesting__start__info__height">
                                <div class="vesting-info-title">Blockchain height</div>
                                <div>${Utils.numberWithCommas(this.componentParams.vestingStart)}</div>
                            </div>
                            <div class="vesting__end__info__date">
                                <div class="vesting-info-title">Date</div>
                                <div>${this.componentParams.vestingStartDate}</div>
                            </div>
                        </div>
                    </div>
                    <div class="vesting__end">
                        <div class="vesting-title">VESTING END</div>
                        <div class="vesting__end__info">
                            <div class="vesting__end__info__height">
                                <div class="vesting-info-title">Blockchain height</div>
                                <div>${Utils.numberWithCommas(this.componentParams.vestingEnd)}</div>
                            </div>
                            <div class="vesting__start__info__date">
                                <div class="vesting-info-title">Date</div>
                                <div>${this.componentParams.vestingEndDate}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="container__content__info">
                <div class="container__content__info__stats">
                    <div class="allocation__calculated__content__distributed">
                        <div class="allocation-title">Distributed</div>
                        <div class="distributed-value">
                            ${Utils.numberWithCommas(this.componentParams.distributedStr)} BEAMX
                        </div>
                    </div>
                    <div class="allocation__calculated__content__available">
                        <div class="allocation-title">Available</div>
                        <div class="available-value">
                            ${Utils.numberWithCommas(this.componentParams.availableStr)} BEAMX
                        </div>
                    </div>
                    <div class="allocation__calculated__content__locked">
                        <div class="allocation-title">Locked</div>
                        <div class="locked-value">
                            ${Utils.numberWithCommas(this.componentParams.lockedStr)} BEAMX
                        </div>
                    </div>
                </div>
                <div class="container__content__info__button">
                    <div class="farmed-claim" id="allocation-claim">
                        <img class="farmed-claim__icon" src="./icons/icon-star.svg">
                        <span class="farmed-claim__text">claim</span>
                    </div>
                </div>
                <div class="container__content__info__graph">
                    <span class="alloc-graph-supply-top alloc-graph-text"> 
                        <span id="alloc-supply-value-top">${this.nFormatter(this.componentParams.distrGraph, 2)}</span>
                    </span>
                    <div class="alloc__graph">
                        <span class="alloc-graph-supply alloc-graph-text"> 
                            <span id="alloc-supply-value">${this.nFormatter(this.componentParams.distrGraph, 2)}</span>
                        </span>
                        <div class="alloc__graph__available" id="alloc-progress-available">
                        <span class="alloc-graph-aval alloc-graph-text"> 
                            <span id="alloc-avail-value">${this.nFormatter(this.componentParams.availGraph, 2)}</span>
                        </span>
                        </div>
                        <div class="alloc__graph__value" id="alloc-progress-value">
                        <span class="alloc-graph-aval-inside"> 
                            <span id="alloc-avail-value-inside">${this.nFormatter(this.componentParams.availGraph, 2)}</span>
                        </span>
                        <span class="alloc-graph-distr">
                            <span id="alloc-distr-value">${this.nFormatter(this.componentParams.lockedGraph, 2)}</span>
                        </span>
                        </div>
                    </div>
                    <span class="alloc-graph-distr-bottom alloc-graph-text">
                        <span id="alloc-distr-value-bottom">${this.nFormatter(this.componentParams.lockedGraph, 2)}</span>
                    </span>
                </div>
            </div>
          </div>
      </div>`;

      return this.componentParams.total > 0 ? TEMPLATE : '';
    }

    nFormatter(num, digits) {
        const lookup = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" }
        ];
        const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        var item = lookup.slice().reverse().find(function(item) {
            return num >= item.value;
        });
        return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
    }

    updateGraph() {
        const elemHeight = $('.alloc__graph').height();
        const progressHeight = this.componentParams.distributed > 0 
            ? Math.ceil(elemHeight * 
                (this.componentParams.locked / this.componentParams.total))
            : 0;

        if (progressHeight <= 18) {
            $('.alloc-graph-distr-bottom').show();
            $('.alloc-graph-distr').hide();
        } else {
            $('.alloc-graph-distr-bottom').hide();
            $('.alloc-graph-distr').show();
        }
        $('#alloc-progress-value').height(progressHeight + 'px');

        const distrPosition = this.componentParams.total > 0 && this.componentParams.locked > 0
            ? Math.ceil(elemHeight *
                (this.componentParams.distributed / this.componentParams.total))
            : 0;
        if (distrPosition <= 18) {
            $('.alloc-graph-supply-top').show();
            $('.alloc-graph-supply').hide();
        } else {
            $('.alloc-graph-supply-top').hide();
            $('.alloc-graph-supply').show();
        }
        
        const availDist = (elemHeight - (distrPosition + progressHeight));

        if (availDist == 0) {
            $('.alloc-graph-aval-inside').hide();
            $('.alloc-graph-aval').hide();
        } else {
            if (availDist <= 18) {
            $('.alloc-graph-aval').css('margin-top', '-16px');
            if (distrPosition <= 36) {
                $('.alloc-graph-aval').hide();
                $('.alloc-graph-aval-inside').show();
            } else {
                $('.alloc-graph-aval').show();
                $('.alloc-graph-aval-inside').hide();
            }
            } else {
            $('.alloc-graph-aval-inside').hide();
            $('.alloc-graph-aval').show();
            }
        }

        $('#alloc-progress-available').css('margin-top', distrPosition + 'px');
    }

    updateStats() {
        const progressWidth = this.componentParams.total > 0 && this.componentParams.distributed > 0 
        ? Math.ceil($('#allocation-progress').width() * 
            (this.componentParams.locked / this.componentParams.total)) 
        : 0;
        $('#allocation-progress-value').width(progressWidth + 'px');

        const availablePosition = this.componentParams.total > 0 && this.componentParams.available > 0
            ? Math.ceil($('#allocation-progress').width() *
                (this.componentParams.available / this.componentParams.total)) 
            : 0;
        $('#allocation-progress-available').css('margin-left',(availablePosition) + 'px');
    }

    render() {
        this.innerHTML = this.getTemplate();
        this.updateStats();
        $('#allocation-claim').click(() => {
            const component = $('claim-rewards-popup-component');
            component.attr('is_allocation', 1);
            component.attr('value_str', this.componentParams.availableStr);
            component.attr('value', this.componentParams.available);
        });
    };
  
    connectedCallback() {
      this.render();
    }
    
    attributeChangedCallback(name, oldValue, newValue) {    
        let value = Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM);
        if (name === 'total') {
            this.componentParams.total = newValue;
            this.componentParams.totalStr = Utils.formateValue(value);
        } else if (name === 'avail_total') {
            
        } else if (name === 'received') {
            this.componentParams.distributed = newValue;
            this.componentParams.distributedStr = Utils.formateValue(value);
            this.componentParams.distrGraph = parseFloat(Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM));
        } else if (name === 'locked') {
            this.componentParams.locked = newValue;
            this.componentParams.lockedStr = Utils.formateValue(value);
            this.componentParams.lockedGraph = parseFloat(Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM));
        } else if (name === 'allocated') {
            this.componentParams.allocated = newValue;
            this.componentParams.allocatedStr = Utils.formateValue(value);
        } else if (name === 'remaining') {
            this.componentParams.available = newValue;
            this.componentParams.availableStr = Utils.formateValue(value);
            this.componentParams.availGraph = parseFloat(Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM));
        } else if (name === 'vesting_start') {
            this.componentParams.vestingStart = newValue;
        } else if (name === 'vesting_end') {
            this.componentParams.vestingEnd = newValue;
        } else if (name === 'cur_height') {
            this.componentParams.currentHeight = newValue;
        } else if (name === 'timestamp') {
            const startDiff = this.componentParams.vestingStart - this.componentParams.currentHeight;
            const endDiff = this.componentParams.vestingEnd - this.componentParams.currentHeight;
            const months = [
                "January", "February",
                "March", "April", "May",
                "June", "July", "August",
                "September", "October",
                "November", "December"
            ];
            const startDiffDate = new Date(newValue * 1000 + startDiff * 60000);
            const endDiffDate = new Date(newValue * 1000 + endDiff * 60000);

            this.componentParams.vestingStartDate = startDiffDate.getDate()  + " " 
                + months[startDiffDate.getMonth()] + " " + startDiffDate.getFullYear();
            this.componentParams.vestingEndDate = endDiffDate.getDate()  + " " 
                + months[endDiffDate.getMonth()] + " " + endDiffDate.getFullYear();
        }
        this.render();
        this.updateGraph();
    }
  
    
    static get observedAttributes() {
      return [
          'total',
          'received',
          'avail_total',
          'locked',
          'remaining',
          'allocated',
          'vesting_start',
          'vesting_end',
          'timestamp',
          'cur_height'
        ];
    }
  }

  customElements.define('allocation-component', AllocationComponent);
