import Utils from "./../../libs/utils.js";
import * as consts from "./../../consts/consts.js"; 

class DepositPopupComponent extends HTMLElement {
    switcherValues = {
        'switch-one-week': '1 week',
        'switch-two-weeks': '2 w',
        'switch-one-month': '1 M',
        'switch-two-months': '2 M',
        'switch-three-months': '3 M',
        'switch-six-months': '6 M'
    }

    componentParams = {
        loaded: 0,
        rate: 0,
        estimation,
        switcherSelectedValue: this.switcherValues['switch-one-week']
    }

    constructor() {
        super();
    }

    getRateStr(value) {
        return (this.componentParams.rate > 0 && value > 0
          ? Utils.numberWithSpaces(Utils.formateValue(new Big(value).times(this.componentParams.rate)))
          : '0') + ' USD';
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
                            <div class="deposit-area__fee__value__rate">
                                ${ this.getRateStr(consts.GLOBAL_CONSTS.TRANSACTION_FEE_BEAM) }
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
                        <div class="switch__item" id="switch-one-week" hval="10080">1 week</div>
                        <div class="switch__item" id="switch-two-weeks" hval="20160">2 w</div>
                        <div class="switch__item" id="switch-one-month" hval="43200">1 M</div>
                        <div class="switch__item" id="switch-two-months" hval="86400">2 M</div>
                        <div class="switch__item" id="switch-three-months" hval="129600">3 M</div>
                        <div class="switch__item" id="switch-six-months" hval="259200">6 M</div>
                        <div class="selector">
                            ${ this.componentParams.switcherSelectedValue }
                        </div>
                    </div>
                    <div class="calc-area__reward">
                        <div class="calc-area__reward__yearly">
                            <div class="calc-area-title">Yearly reward</div>
                            <div class="calc-area-value">12-14 BEAMX</div>
                        </div>
                        <div class="calc-area__reward__weekly">
                            <div class="calc-area-title">Weekly reward</div>
                            <div class="calc-area-value">0.23-0.67 BEAMX</div>
                        </div>
                    </div>
                    <div class="calc-area__farming">
                        <div class="calc-area-title">Farming estimation</div>
                        <div class="calc-area__farming__value">
                            <img class="calc-area-icon" src="./icons/icon-beamx.png"/>
                            <span class="calc-area-estimation">
                                ${ this.componentParams.estimation } BEAMX
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

      return TEMPLATE;
    }
  
    render() {
        if (this.componentParams.loaded > 0) {
            this.innerHTML = this.getTemplate();

            $('#deposit-cancel').click(() => {
                $('deposit-popup-component').hide();
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

            $('#deposit-input').on('input', (event) => {
                const value = $('#deposit-input').val();
                $('#deposit-input-rate').text(this.getRateStr(value.length > 0 ? value : 0));
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
                const text = event.clipboardData.getData('text');
                if (!Utils.handleString(text)) {
                    event.preventDefault();
                }
            })

            $('.switch__item').click((event) => {
                let targetItem = $(event.target);
                this.componentParams.switcherSelectedValue = targetItem.attr('id');
                
                let selectorItem = $('.selector');
                selectorItem.text(this.switcherValues[this.componentParams.switcherSelectedValue]);
                selectorItem.width(targetItem.width() + 22);
                selectorItem.css('left', targetItem.position().left);
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
        } else if (name === 'rate') {
            this.componentParams.rate = newValue;
        } else if (name === 'estimation') {
            this.componentParams.estimation = newValue;
        }
    }
  
    
    static get observedAttributes() {
      return ['loaded', 'rate', 'estimation'];
    }
  }

  customElements.define('deposit-popup-component', DepositPopupComponent);
