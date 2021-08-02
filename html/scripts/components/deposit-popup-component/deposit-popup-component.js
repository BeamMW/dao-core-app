import Utils from "./../../libs/utils.js";
import * as consts from "./../../consts/consts.js"; 

class DepositPopupComponent extends HTMLElement {
    switcherValues = {
        'switch-one-week': {
            value: '1 w',
            fullValue: '1 week',
            height: 10080,
            wCount: 1,
        },
        'switch-two-weeks': {
            value: '2 w',
            fullValue: '2 week',
            height: 20160,
            wCount: 2,
        },
        'switch-one-month': {
            value: '1 M',
            fullValue: '1 Month',
            height: 43200,
            wCount: 4.4,
        },
        'switch-two-months': {
            value: '2 M',
            fullValue: '2 Month',
            height: 86400,
            wCount: 8.8,
        },
        'switch-three-months': {
            value: '3 M',
            fullValue: '3 Month',
            height: 129600,
            wCount: 13.2,
        }
    }

    componentParams = {
        loaded: 0,
        rate: 0,
        yeild: 0,
        yeildStr: '',
        weeklyRewardStr: '',
        switcherSelectedValue: this.switcherValues['switch-one-week'],
        prevSwitcherValue: 'switch-one-week'
    }

    constructor() {
        super();
    }

    getTemplate() {
        const TEMPLATE =
        `<div class="popup">
            <div class="popup__content deposit-tmpl">
                <div class="deposit-area">
                    <div class="area-header">Deposit</div>
                    <div class="deposit-area__input">
                        <input type="text" class="deposit-area__input__elem" placeholder="0" id="deposit-input"/>
                        <span class="deposit-area__input__text">BEAM</span>
                    </div>
                    <div class="deposit-area__rate" id="deposit-input-rate">
                        0 USD
                    </div>
                    <div class="deposit-area__fee">
                        <div class="deposit-area__fee__title">Fee</div>
                        <div class="deposit-area__fee__value">
                            <div class="deposit-area__fee__value__beam">
                                ${ consts.GLOBAL_CONSTS.TRANSACTION_FEE_BEAM } BEAM
                            </div>
                            <div class="deposit-area__fee__value__rate" id="deposit-fee-rate">
                                ${ Utils.getRateStr(consts.GLOBAL_CONSTS.TRANSACTION_FEE_BEAM, this.componentParams.rate) }
                            </div>
                        </div>
                    </div>
                    <div class="deposit-area__controls">
                        <button class="container__main__controls__cancel ui-button" id="deposit-cancel">
                            <span class="ui-button__inner-wrapper">
                                <div class="ui-button__icon">
                                    <img src="./icons/icon-cancel.svg"/>
                                </div>
                                <span class="ui-button__text cancel-text">cancel</span>
                            </span>
                        </button>
                        <button class="deposit-area__controls__deposit ui-button" id="deposit-confirm">
                            <span class="ui-button__inner-wrapper">
                                <div class="ui-button__icon">
                                    <img src="./icons/icon-deposit-blue.svg"/>
                                </div>
                                <span class="ui-button__text confirm-text">deposit</span>
                            </span>
                        </button>
                    </div>
                </div>    
                <div class="calc-area">
                    <div class="area-header">Staking calculator</div>
                    <div class="calc-area__info">The longer you stake for, the higher the reward is.</div>
                    <div class="switch">
                        <div class="switch__item" id="switch-one-week" 
                                hval="${this.switcherValues['switch-one-week'].height}">
                            ${this.switcherValues['switch-one-week'].fullValue}
                        </div>
                        <div class="switch__item" id="switch-two-weeks" 
                                hval="${this.switcherValues['switch-two-weeks'].height}">
                            ${this.switcherValues['switch-two-weeks'].value}
                        </div>
                        <div class="switch__item" id="switch-one-month" 
                                hval="${this.switcherValues['switch-one-month'].height}">
                            ${this.switcherValues['switch-one-month'].value}
                        </div>
                        <div class="switch__item" id="switch-two-months" 
                                hval="${this.switcherValues['switch-two-months'].height}">
                            ${this.switcherValues['switch-two-months'].value}
                        </div>
                        <div class="switch__item" id="switch-three-months" 
                                hval="${this.switcherValues['switch-three-months'].height}">
                            ${this.switcherValues['switch-three-months'].value}
                        </div>
                        <div class="selector">
                            ${ this.componentParams.switcherSelectedValue.fullValue }
                        </div>
                    </div>
                    <div class="calc-area__reward">
                        <div class="calc-area__reward__weekly">
                            <div class="calc-area-title">Weekly reward</div>
                            <div class="calc-area-value" id="deposit-weekly-reward">0 BEAMX</div>
                        </div>
                    </div>
                    <div class="calc-area__farming">
                        <div class="calc-area-title">Farming estimation</div>
                        <div class="calc-area__farming__value">
                            <img class="calc-area-icon" src="./icons/icon-beamx.svg"/>
                            <span class="calc-area-estimation" id="deposit-estimation">
                                0 BEAMX
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

      return TEMPLATE;
    }

    triggerYeildCalc() {
        const value = $('#deposit-input').val();
        if (value > 0) {
            let event = new CustomEvent("global-event", {
                detail: {
                type: 'calc-yeild',
                from: 'deposit',
                amount: (Big($('#deposit-input').val()).times(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM)).toFixed(),
                hPeriod: this.componentParams.switcherSelectedValue.height
                }
            });
            document.dispatchEvent(event);
        }
    }
  
    render() {
        if (this.componentParams.loaded > 0) {
            this.innerHTML = this.getTemplate();

            $('#deposit-cancel').click(() => {
                $('deposit-popup-component').hide();
                this.componentParams.yeild = 0;
                this.componentParams.yeildStr = '';
                this.componentParams.weeklyRewardStr = '';
                this.componentParams.switcherSelectedValue = this.switcherValues['switch-one-week']
            });

            $('#deposit-confirm').click(() => {
                let event = new CustomEvent("global-event", {
                    detail: {
                      type: 'deposit-process',
                      amount: (Big($('#deposit-input').val()).times(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM)).toFixed()
                    }
                  });
                document.dispatchEvent(event);
                $('deposit-popup-component').hide();
            })

            $('.popup__content.deposit-tmpl').css('height', 'unset');
            $('deposit-popup-component').show();

            $('#deposit-input').on('input', (e) => {
                const value = $('#deposit-input').val();
                $('#deposit-input-rate').text(Utils.getRateStr(value.length > 0 ? value : 0, this.componentParams.rate));

                this.triggerYeildCalc();
             });

            $('#deposit-input').keydown((event) => {
                const specialKeys = [
                    'Backspace', 'Tab', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp',
                    'Control', 'Delete', 'F5'
                  ];

                if (specialKeys.indexOf(event.key) !== -1) {
                    return;
                }

                const current = $('#deposit-input').val();
                const next = current.concat(event.key);
            
                if (!Utils.handleString(next)) {
                    event.preventDefault();
                }
            })

            $('#deposit-input').bind('paste', (event) => {
                if (event.clipboardData !== undefined) {
                    const text = event.clipboardData.getData('text');
                    if (!Utils.handleString(text)) {
                        event.preventDefault();
                    }
                }
            })

            $('.switch__item').click((event) => {
                let targetItem = $(event.target);
                if (this.componentParams.prevSwitcherValue) {
                    let prevItem = $('#'+this.componentParams.prevSwitcherValue);
                    prevItem.text(this.componentParams.switcherSelectedValue.value);
                    prevItem.css('min-width', '25px');
                }
                this.componentParams.switcherSelectedValue = this.switcherValues[targetItem.attr('id')];
                targetItem.text(this.componentParams.switcherSelectedValue.fullValue);
                targetItem.css('min-width', '50px');
                let selectorItem = $('.selector');
                selectorItem.text(this.componentParams.switcherSelectedValue.fullValue);
                selectorItem.width(targetItem.width() + 29);
                selectorItem.css('left', targetItem.position().left - 1);
                
                this.componentParams.prevSwitcherValue = targetItem.attr('id');
                this.triggerYeildCalc();
            })

            Utils.loadStyles();
        }
    };
  
    connectedCallback() {
      this.render();
    }
    
    attributeChangedCallback(name, oldValue, newValue) {    
        if (name === 'loaded') {
            this.componentParams.loaded = newValue;
            this.render();
            $('#switch-one-week').css('min-width', '50px')
        } else if (name === 'rate') {
            this.componentParams.rate = newValue;
            $('#deposit-fee-rate').text(Utils.getRateStr(consts.GLOBAL_CONSTS.TRANSACTION_FEE_BEAM, this.componentParams.rate));
        } else if (name === 'yeild') {
            this.componentParams.yeild = newValue;
            this.componentParams.yeildStr = Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM);
            this.componentParams.weeklyRewardStr = 
                this.componentParams.yeildStr.div(this.componentParams.switcherSelectedValue.wCount);
            
            $('#deposit-weekly-reward').text((parseFloat(this.componentParams.weeklyRewardStr) > 0 
                ? Utils.numberWithCommas(Utils.formateValue(this.componentParams.weeklyRewardStr)) 
                : '0') + ' BEAMX');
            $('#deposit-estimation').text(
                (parseFloat(this.componentParams.yeildStr) > 0 
                ? Utils.numberWithCommas(Utils.formateValue(this.componentParams.yeildStr)) 
                : '0') + ' BEAMX');
        }
    }
  
    
    static get observedAttributes() {
      return ['loaded', 'rate', 'yeild'];
    }
  }

  customElements.define('deposit-popup-component', DepositPopupComponent);
