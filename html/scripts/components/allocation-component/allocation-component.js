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
      remaining: 0
    }

    constructor() {
      super();
    }

    getTemplate() {
      const TEMPLATE =
      `<div class="allocation">
          <div class="container__header">INVESTOR ALLOCATION</div>
          <div class="container__content">
            <div class="allocation__stats">
                <div class="allocation__stats__allocated">
                    <div class="allocation-title">Allocated</div>
                    <div class="allocated-value">
                        ${Utils.numberWithCommas(this.componentParams.allocatedStr)} BEAMX
                    </div>
                </div>
                <div class="allocation-total-temporary">
                    <div class="allocation__stats__vested">
                        <div class="allocation-title">Total vested</div>
                        <div class="vested-value">
                            ${Utils.numberWithCommas(this.componentParams.totalStr)} BEAMX
                        </div>
                    </div>
                    <div class="farmed-claim" id="allocation-claim">
                        <img class="farmed-claim__icon" src="./icons/icon-star.svg">
                        <span class="farmed-claim__text">claim rewards</span>
                    </div>
                </div>
            </div>
            <div class="allocation__calculated">
                <div class="allocation__calculated__content">
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
                <div class="allocation__calculated__graph" id="allocation-progress">
                    <div class="allocation__calculated__graph__value" id="allocation-progress-value"></div>
                    <div class="allocation__calculated__graph__available" id="allocation-progress-available"></div>
                </div>
            </div>
          </div>
      </div>`;

      return this.componentParams.total > 0 ? TEMPLATE : '';
    }
  
    updateStats() {
        const progressWidth = this.componentParams.total > 0 && this.componentParams.distributed > 0 
        ? Math.ceil($('#allocation-progress').width() * 
            (this.componentParams.distributed / this.componentParams.total)) 
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
        } else if (name === 'locked') {
            this.componentParams.locked = newValue;
            this.componentParams.lockedStr = Utils.formateValue(value);
        } else if (name === 'allocated') {
            this.componentParams.allocated = newValue;
            this.componentParams.allocatedStr = Utils.formateValue(value);
        } else if (name === 'remaining') {
            this.componentParams.available = newValue;
            this.componentParams.availableStr = Utils.formateValue(value);
        }
        this.render();
    }
  
    
    static get observedAttributes() {
      return ['total', 'received', 'avail_total', 'locked', 'remaining', 'allocated'];
    }
  }

  customElements.define('allocation-component', AllocationComponent);
