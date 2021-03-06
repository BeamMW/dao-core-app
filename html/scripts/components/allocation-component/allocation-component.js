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
      currentHeight: 0,
      is_alloc_expanded: true
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
                        <div class="vested-value" id="alloc-total-value">
                            ${Utils.numberWithCommas(this.componentParams.totalStr)} BEAMX
                        </div>
                    </div>
                    <div class="vesting">
                        <div class="vesting__start">
                            <div class="vesting-title">VESTING START</div>
                            <div class="vesting__start__info">
                                <div class="vesting__start__info__height">
                                    <div class="vesting-info-title">Blockchain height</div>
                                    <div id="vesting-start-value">${Utils.numberWithCommas(this.componentParams.vestingStart)}</div>
                                </div>
                                <div class="vesting__end__info__date">
                                    <div class="vesting-info-title">Date</div>
                                    <div id="v-start-value">${this.componentParams.vestingStartDate}</div>
                                </div>
                            </div>
                        </div>
                        <div class="vesting__end">
                            <div class="vesting-title">VESTING END</div>
                            <div class="vesting__end__info">
                                <div class="vesting__end__info__height">
                                    <div class="vesting-info-title">Blockchain height</div>
                                    <div id="vesting-end-value">${Utils.numberWithCommas(this.componentParams.vestingEnd)}</div>
                                </div>
                                <div class="vesting__start__info__date">
                                    <div class="vesting-info-title">Date</div>
                                    <div id="v-end-value">${this.componentParams.vestingEndDate}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="container__content__info">
                    <div class="container__content__info__stats">
                        <div class="allocation__calculated__content__distributed">
                            <div class="allocation-title">Distributed</div>
                            <div class="distributed-value" id="alloc-distributed-value">
                                ${Utils.numberWithCommas(this.componentParams.distributedStr)} BEAMX
                            </div>
                        </div>
                        <div class="allocation__calculated__content__available">
                            <div class="allocation-title">Available</div>
                            <div class="available-value" id="alloc-available-value">
                                ${Utils.numberWithCommas(this.componentParams.availableStr)} BEAMX
                            </div>
                        </div>
                        <div class="allocation__calculated__content__locked">
                            <div class="allocation-title">Locked</div>
                            <div class="locked-value" id="alloc-locked-value">
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
                            <span id="alloc-supply-value-top">
                                ${this.nFormatter(this.componentParams.distrGraph, 2)}
                            </span>
                        </span>
                        <div class="alloc__graph">
                            <span class="alloc-graph-supply alloc-graph-text"> 
                                <span id="alloc-supply-value">
                                    ${this.nFormatter(this.componentParams.distrGraph, 2)}
                                </span>
                            </span>
                            <div class="alloc__graph__available" id="alloc-progress-available">
                                <span class="alloc-graph-aval alloc-graph-text"> 
                                    <span id="alloc-avail-value">
                                        ${this.nFormatter(this.componentParams.availGraph, 2)}
                                    </span>
                                </span>
                            </div>
                            <div class="alloc__graph__value" id="alloc-progress-value">
                                <span class="alloc-graph-aval-inside"> 
                                    <span id="alloc-avail-value-inside">
                                        ${this.nFormatter(this.componentParams.availGraph, 2)}
                                    </span>
                                </span>
                                <span class="alloc-graph-distr">
                                    <span id="alloc-distr-value">
                                        ${this.nFormatter(this.componentParams.lockedGraph, 2)}
                                    </span>
                                </span>
                            </div>
                        </div>
                        <span class="alloc-graph-distr-bottom alloc-graph-text">
                            <span id="alloc-distr-value-bottom">
                                ${this.nFormatter(this.componentParams.lockedGraph, 2)}
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        </div>`;

        return TEMPLATE;
    }

    getMobileTpl() {
        const TEMPLATE =
        `<div class="allocation">
            <div class="container__header">
                <span>INVESTOR ALLOCATION</span>
                <img id="alloc-area-icon" class="m-area-header__icon" src="./icons/mobile-arrow-down.svg"/>
            </div>
            <div id="alloc-content">
                <div class="container__content">
                    <div class="container__content__vesting">
                        <div class="container__content__vesting__vested">
                            <div class="allocation-title">Total vested</div>
                            <div class="vested-value" id="alloc-total-value">
                                ${Utils.numberWithCommas(this.componentParams.totalStr)} BEAMX
                            </div>
                        </div>
                        <div class="vesting">
                            <div class="vesting__start">
                                <div class="vesting-title">VESTING START</div>
                                <div class="vesting__start__info">
                                    <div class="vesting__start__info__height">
                                        <div class="vesting-info-title">Blockchain height</div>
                                        <div id="vesting-start-value">${Utils.numberWithCommas(this.componentParams.vestingStart)}</div>
                                    </div>
                                    <div class="vesting__end__info__date">
                                        <div class="vesting-info-title">Date</div>
                                        <div id="v-start-value">${this.componentParams.vestingStartDate}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="vesting__end">
                                <div class="vesting-title">VESTING END</div>
                                <div class="vesting__end__info">
                                    <div class="vesting__end__info__height">
                                        <div class="vesting-info-title">Blockchain height</div>
                                        <div id="vesting-end-value">${Utils.numberWithCommas(this.componentParams.vestingEnd)}</div>
                                    </div>
                                    <div class="vesting__start__info__date">
                                        <div class="vesting-info-title">Date</div>
                                        <div id="v-end-value">${this.componentParams.vestingEndDate}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="container__content__info">
                        <div class="container__content__info__stats">
                            <div class="allocation__calculated__content__distributed">
                                <div class="allocation-title">Distributed</div>
                                <div class="distributed-value" id="alloc-distributed-value">
                                    ${Utils.numberWithCommas(this.componentParams.distributedStr)} BEAMX
                                </div>
                            </div>
                            <div class="allocation__calculated__content__available">
                                <div class="allocation-title">Available</div>
                                <div class="available-value" id="alloc-available-value">
                                    ${Utils.numberWithCommas(this.componentParams.availableStr)} BEAMX
                                </div>
                            </div>
                            <div class="allocation__calculated__content__locked">
                                <div class="allocation-title">Locked</div>
                                <div class="locked-value" id="alloc-locked-value">
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
                                <span id="alloc-supply-value-top">
                                    ${this.nFormatter(this.componentParams.distrGraph, 2)}
                                </span>
                            </span>
                            <div class="alloc__graph">
                                <span class="alloc-graph-supply alloc-graph-text"> 
                                    <span id="alloc-supply-value">
                                        ${this.nFormatter(this.componentParams.distrGraph, 2)}
                                    </span>
                                </span>
                                <div class="alloc__graph__available" id="alloc-progress-available">
                                    <span class="alloc-graph-aval alloc-graph-text"> 
                                        <span id="alloc-avail-value">
                                            ${this.nFormatter(this.componentParams.availGraph, 2)}
                                        </span>
                                    </span>
                                </div>
                                <div class="alloc__graph__value" id="alloc-progress-value">
                                    <span class="alloc-graph-aval-inside"> 
                                        <span id="alloc-avail-value-inside">
                                            ${this.nFormatter(this.componentParams.availGraph, 2)}
                                        </span>
                                    </span>
                                    <span class="alloc-graph-distr">
                                        <span id="alloc-distr-value">
                                            ${this.nFormatter(this.componentParams.lockedGraph, 2)}
                                        </span>
                                    </span>
                                </div>
                            </div>
                            <span class="alloc-graph-distr-bottom alloc-graph-text">
                                <span id="alloc-distr-value-bottom">
                                    ${this.nFormatter(this.componentParams.lockedGraph, 2)}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        return TEMPLATE;
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
        const progressHeight = this.componentParams.locked > 0 
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
        const progressWidth = this.componentParams.total > 0 && this.componentParams.locked > 0 
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
        this.innerHTML = this.getMobileTpl();
        //this.innerHTML = Utils.isMobile() ? this.getMobileTpl() : this.getTemplate();
        this.updateStats();
        $('#allocation-claim').click(() => {
            const component = $('claim-rewards-popup-component');
            component.attr('is_allocation', 1);
            component.attr('value_str', this.componentParams.availableStr);
            component.attr('value', this.componentParams.available);
        });

        if (Utils.isMobile()) {
            this.componentParams.is_alloc_expanded ? $('#alloc-content').show() : $('#alloc-content').hide();
                            
            $('#alloc-area-icon').show();
            $('#alloc-area-icon').on('click', () => {
                this.componentParams.is_alloc_expanded = !this.componentParams.is_alloc_expanded;
            this.componentParams.is_alloc_expanded ? $('#alloc-content').show() : $('#alloc-content').hide();
            $("#alloc-area-icon").attr("src", this.componentParams.is_alloc_expanded ? "./icons/mobile-arrow-down.svg" 
                : "./icons/mobile-arrow-up.svg");
            })
        }
    };
  
    connectedCallback() {
      this.render();
    }
    
    attributeChangedCallback(name, oldValue, newValue) {    
        let value = Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM);
        if (name === 'total') {
            if (this.componentParams.total === 0) {
                this.render();
            }

            this.componentParams.total = newValue;
            this.componentParams.totalStr = Utils.formateValue(value);

            $('#alloc-total-value').text(Utils.numberWithCommas(this.componentParams.totalStr) + ' BEAMX');
        } else if (name === 'received') {
            this.componentParams.distributed = newValue;
            this.componentParams.distributedStr = Utils.formateValue(value);
            this.componentParams.distrGraph = parseFloat(Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM));

            $('#alloc-supply-value-top').text(this.nFormatter(this.componentParams.distrGraph));
            $('#alloc-supply-value').text(this.nFormatter(this.componentParams.distrGraph));
            $('#alloc-distributed-value').text(Utils.numberWithCommas(this.componentParams.distributedStr) + ' BEAMX');
        } else if (name === 'locked') {
            this.componentParams.locked = newValue;
            this.componentParams.lockedStr = Utils.formateValue(value);
            this.componentParams.lockedGraph = parseFloat(Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM));

            $('#alloc-locked-value').text(Utils.numberWithCommas(this.componentParams.lockedStr) + ' BEAMX');
            $('#alloc-distr-value').text(this.nFormatter(this.componentParams.lockedGraph, 2));
            $('#alloc-distr-value-bottom').text(this.nFormatter(this.componentParams.lockedGraph, 2));
        } else if (name === 'allocated') {
            this.componentParams.allocated = newValue;
            this.componentParams.allocatedStr = Utils.formateValue(value);
        } else if (name === 'remaining') {
            this.componentParams.available = newValue;
            this.componentParams.availableStr = Utils.formateValue(value);
            this.componentParams.availGraph = parseFloat(Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM));

            $('#alloc-available-value').text(Utils.numberWithCommas(this.componentParams.availableStr) + ' BEAMX');
            $('#alloc-avail-value').text(this.nFormatter(this.componentParams.availGraph, 2));
            $('#alloc-avail-value-inside').text(this.nFormatter(this.componentParams.availGraph, 2));
        } else if (name === 'vesting_start') {
            this.componentParams.vestingStart = newValue;
            $('#vesting-start-value').text(Utils.numberWithCommas(newValue));
        } else if (name === 'vesting_end') {
            this.componentParams.vestingEnd = newValue;
            $('#vesting-end-value').text(Utils.numberWithCommas(newValue));
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
            $('#v-start-value').text(this.componentParams.vestingStartDate);
            $('#v-end-value').text(this.componentParams.vestingEndDate);
            this.updateGraph();
        }
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
