import Utils from "./libs/utils.js";
import * as consts from "./consts/consts.js";

const CONTRACT_ID = "3f3d32e38cb27ac7b5b67343f81cf2f8bc53217eb995cc6c5d78ddc5e7b0642b";
const REJECTED_CALL_ID = -32021;
const IN_PROGRESS_ID = 5;
const TIMEOUT = 3000;

class DaoCore {
    constructor() {
        this.timeout = undefined;
        this.pluginData = {
            inTransaction: false,
            lockedBeams: 0,
            stake: 0,
            inProgress: false,
            mainLoaded: false,
            beamTotalLocked: 0,
            farmTotal: 0,
            vestingStart: null,
            vestingEnd: null
        }
    }

    getRate = () => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://api.coingecko.com/api/v3/simple/price?ids=beam&vs_currencies=usd');
        xhr.send();
        xhr.onload = () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.response);
                if (response.beam !== undefined && response.beam.usd !== undefined) {
                    $('staking-component').attr('rate', response.beam.usd);
                    $('withdraw-popup-component').attr('rate', response.beam.usd);
                    $('deposit-popup-component').attr('rate', response.beam.usd);
                }
            }
        };
    }

    setError = (errmsg) => {
        let errorElementId = "#error-common";
        if ($('#main-page').css('display') === 'none') {
            errorElementId = "#error-full";
            $('#error-full-container').show();
        } else {
            $('#error-common').show();
        }

        $(errorElementId).text(errmsg);
        if (this.timeout) {
            clearTimeout(this.timeout);   
        }
        this.timeout = setTimeout(() => {
            $(errorElementId).text(errmsg);
            this.start();
        }, TIMEOUT)
    }

    applyStyles = () => {
        const styles = Utils.getStyles();
        const topColor =  [styles.appsGradientOffset, "px,"].join('');
        const mainColor = [styles.appsGradientTop, "px,"].join('');
        if (!Utils.isDesktop()) {
            $('body').css('background-image', [
                "linear-gradient(to bottom,",
                styles.background_main_top, topColor,
                styles.background_main, mainColor,
                styles.background_main
            ].join(' '));
            $('body').css('background-repeat', 'no-repeat');
            $('body').css('background-attachment', 'fixed');
        }

        document.body.style.color = styles.content_main;
        document.querySelectorAll('.popup').forEach(item => {
            item.style.backgroundImage = `linear-gradient(to bottom,
            ${Utils.hex2rgba(styles.background_main_top, 0.6)} ${topColor}
            ${Utils.hex2rgba(styles.background_main, 0.6)} ${mainColor}
            ${Utils.hex2rgba(styles.background_main, 0.6)}`;
        });
        
        document.querySelectorAll('.popup__content').forEach(item => {
            item.style.backgroundColor = Utils.hex2rgba(styles.background_popup, 1);
        });

        document.getElementById('error-full').style.color = styles.validator_error;
        document.getElementById('error-common').style.color = styles.validator_error;
    }

    start = () => {
        Utils.download("./daoCore.wasm", (err, bytes) => {
            if (err) {
                let errTemplate = "Failed to load shader,";
                let errMsg = [errTemplate, err].join(" ");
                return this.setError(errMsg);
            }
    
            Utils.callApi("farm_view", "invoke_contract", {
                contract: bytes,
                create_tx: false,
                args: "role=manager,action=farm_view,cid=" + CONTRACT_ID
            });

            this.hidePopups();

            this.applyStyles();
            this.getRate();
            setInterval(() => {
                this.getRate();
            }, 30000);
        })
    }
    
    refresh = (now) => {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(() => {
            Utils.callApi("farm_view", "invoke_contract", {
                create_tx: false,
                args: "role=manager,action=farm_view,cid=" + CONTRACT_ID
            });
        }, now ? 0 : 3000)
    }
    
    parseShaderResult = (apiResult) => {
        if (typeof(apiResult.output) != 'string') {
            throw "Empty shader response";
        }
    
        let shaderOut = JSON.parse(apiResult.output)
        if (shaderOut.error) {
            throw ["Shader error: ", shaderOut.error].join("")
        }
    
        return shaderOut;
    }

    showStakingTimer = (hDiff) => {
        const d = Math.floor(hDiff / (60*24));
        const h = Math.floor(hDiff % (60*24) / 60);
        const m = Math.floor(hDiff % 60);

        $('#timer-days-value').text(d);
        $('#timer-hours-value').text(h);
        $('#timer-minutes-value').text(m);

        $('#bg').show();
        $('#staking-timer').show();
    }

    showStaking = () => {
        if (!this.pluginData.mainLoaded) {
            this.pluginData.mainLoaded = true;
            $('#staking-timer').remove();
            $('#bg').show();
            // $('#main-page').remove();
            // $('#main-page-mobile').show();
            
            if (Utils.isMobile()) {
                $('#main-page').remove();
                $('#main-page-mobile').show();
            } else if (!Utils.isMobile() && (Utils.isWeb() || Utils.isDesktop())) {
                $('#main-page-mobile').remove();
                $('#main-page').show();
            }
            
            $('#staking-page').hide();
            $('#staking-page-back').hide();
            $('#error-full-container').hide();
            $('#error-common').hide();
            $('staking-component').attr('loaded', this.pluginData.mainLoaded | 0);
        }
        this.refresh(false);
    }

    loadPreallocStats = () => {
        Utils.callApi("prealloc_totals", "invoke_contract", {
            create_tx: false,
            args: "role=manager,action=prealloc_totals,cid=" + CONTRACT_ID
        });
    }

    loadFarmStats = () => {
        Utils.callApi("farm_totals", "invoke_contract", {
            create_tx: false,
            args: "role=manager,action=farm_totals,cid=" + CONTRACT_ID
        });
    }

    loadPreallocated = () => {
        Utils.callApi("prealloc_view", "invoke_contract", {
            create_tx: false,
            args: "role=manager,action=prealloc_view,cid=" + CONTRACT_ID
        });
    }

    loadBlockInfo = (height) => {
        Utils.callApi("block_details", "block_details", {
            height
        });
    }

    onApiResult = (json) => {    
        try {
            const apiAnswer = JSON.parse(json);
            console.log('api result:', apiAnswer);
            const apiCallId = apiAnswer.id;
            let apiResult;

            if (apiAnswer.error !== undefined) {
                if (apiAnswer.error.code === REJECTED_CALL_ID) {
                    apiResult = apiAnswer.error;
                } else {
                    throw JSON.stringify(apiAnswer.error)
                }
            } else {
                apiResult = apiAnswer.result;
                if (!apiResult) {
                    throw "Failed to call wallet API";
                }
            }

            if (apiCallId === "farm_view") {
                let shaderOut = this.parseShaderResult(apiResult);
                if (shaderOut.user === undefined) {
                    throw "Failed to load farm view";    
                }

                if (shaderOut.farming.h >= shaderOut.farming.h0) {
                    this.showStaking();
                } else {
                    this.showStakingTimer(shaderOut.farming.h0 - shaderOut.farming.h);
                }
            
                const stakingComponent = $('staking-component');
                stakingComponent.attr('beam-value', shaderOut.user.beams_locked);
                stakingComponent.attr('beamx-value', shaderOut.user.beamX);
                
                this.pluginData.lockedBeams = shaderOut.user.beams_locked;

                this.loadPreallocated();
            } else if (apiCallId === "prealloc_withdraw" || apiCallId === "farm_update") {
                if (apiResult.raw_data === undefined || apiResult.raw_data.length === 0) {
                    throw 'Failed to load raw data';
                }

                Utils.callApi("process_invoke_data", "process_invoke_data", {
                    data: apiResult.raw_data,
                    confirm_comment: ""
                });
            } else if (apiCallId === "prealloc_view") {
                let shaderOut = this.parseShaderResult(apiResult);
                if (shaderOut.total !== undefined) {
                    const component = $('allocation-component');
                    component.attr('total', shaderOut.total);
                    component.attr('received', shaderOut.received);
                    component.attr('avail_total', shaderOut.avail_total);
                    component.attr('locked', shaderOut.total - shaderOut.avail_total);
                    component.attr('remaining', shaderOut.avail_remaining);
                    component.attr('vesting_start', shaderOut.vesting_start);
                    component.attr('vesting_end', shaderOut.vesting_end);
                    component.attr('cur_height', shaderOut.h);
                    this.pluginData.vestingStart = shaderOut.vesting_start;
                    this.pluginData.vestingEnd = shaderOut.vesting_end;
                    this.loadBlockInfo(shaderOut.h);
                } else {
                    $('allocation-component').hide();
                }

                this.loadFarmStats();
            } else if (apiCallId === "my_xid") {
                let shaderOut = this.parseShaderResult(apiResult);

                if (shaderOut.xid === undefined) {
                    throw "Failed to load public key";
                }

                $('public-key-popup-component').attr('key', shaderOut.xid);
            } else if (apiCallId === "farm_totals") {
                let shaderOut = this.parseShaderResult(apiResult);
                
                if (shaderOut.total === undefined) {
                    throw "Failed to load farming totals";
                }

                this.pluginData.farmTotal = shaderOut.total;
                this.pluginData.farmAvail = shaderOut.avail;
                this.pluginData.farmReceived = shaderOut.received;

                $('staking-component').attr('beam_total_locked', shaderOut.beam_locked);
                this.loadPreallocStats();
            } else if (apiCallId === "prealloc_totals") {
                let shaderOut = this.parseShaderResult(apiResult);
                
                if (shaderOut.total === undefined) {
                    throw "Failed to load prealloc totals";
                }

                const govComponent = $('governance-component')
                const availTotal = shaderOut.avail + this.pluginData.farmAvail;
                const receivedTotal = shaderOut.received + this.pluginData.farmReceived;
                const total = shaderOut.total + this.pluginData.farmTotal;

                const availRes = availTotal - receivedTotal;
                const locked = total - availTotal;
                govComponent.attr('total', total);
                govComponent.attr('avail', availRes > 0 ? availRes : 0);
                govComponent.attr('locked', locked > 0 ? locked : 0);
                govComponent.attr('distributed', receivedTotal);

                $('allocation-component').attr('allocated', shaderOut.total);
            } else if (apiCallId === "farm_get_yield") {
                let shaderOut = this.parseShaderResult(apiResult);
                
                if (shaderOut.yield === undefined) {
                    throw "Failed to load yeild";
                }

                const depositComponent = this.pluginData.yieldType === 'deposit' 
                    ? $('deposit-popup-component')
                    : $('staking-component');
                depositComponent.attr('yeild', shaderOut.yield);
            } else if (apiCallId === "block_details") {
                const component = $('allocation-component');
                component.attr('timestamp', apiResult.timestamp);
            } else if (apiCallId == "process_invoke_data") {
            }
        } catch(err) {
            return this.setError(err.toString());
        }
    }

    hidePopups() {
        $('public-key-popup-component').hide();
        $('claim-rewards-popup-component').hide();
        $('deposit-popup-component').hide();
        $('withdraw-popup-component').hide();
        $('info-popup-component').hide();
    }
}

const daoCore = new DaoCore();
Utils.initialize({
        "appname": "BEAM DAO Core",
        "apiResultHandler": daoCore.onApiResult,
    },
    (err) => {
        if (err) {
            daoCore.setError(err);
            return
        }

        daoCore.start();

        document.addEventListener("global-event", (e) => { 
            if (e.detail.type === 'deposit-process') {
                Utils.callApi("farm_update", "invoke_contract", {
                    create_tx: false,
                    args: "role=manager,action=farm_update,cid=" + CONTRACT_ID + 
                        ",bLockOrUnlock=1,amountBeam=" + e.detail.amount
                });
            } else if (e.detail.type === 'withdraw-process') {
                if (e.detail.is_allocation > 0) {
                    Utils.callApi("prealloc_withdraw", "invoke_contract", {
                        create_tx: false,
                        args: "role=manager,action=prealloc_withdraw,cid=" + CONTRACT_ID + 
                            ",amount=" + e.detail.amount
                    });
                } else {
                    Utils.callApi("farm_update", "invoke_contract", {
                        create_tx: false,
                        args: "role=manager,action=farm_update,cid=" + CONTRACT_ID + 
                            ",bLockOrUnlock=0,amountBeam=" + e.detail.amount
                    });
                }
            } else if (e.detail.type === 'show-public-key') {
                Utils.callApi("my_xid", "invoke_contract", {
                    create_tx: false,
                    args: "role=manager,action=my_xid"
                });
            } else if (e.detail.type === 'claim-rewards-process') {
                if (e.detail.is_allocation > 0) {
                    Utils.callApi("prealloc_withdraw", "invoke_contract", {
                        create_tx: false,
                        args: "role=manager,action=prealloc_withdraw,cid=" + CONTRACT_ID + 
                            ",amount=" + e.detail.amount
                    });
                } else {
                    Utils.callApi("farm_update", "invoke_contract", {
                        create_tx: false,
                        args: "role=manager,action=farm_update,cid=" + CONTRACT_ID + 
                            ",bLockOrUnlock=0,amountBeamX=" + e.detail.amount
                    });
                }
            } else if (e.detail.type === 'deposit-popup-open') {
                $('deposit-popup-component').attr('loaded', daoCore.pluginData.mainLoaded | 0);
            } else if (e.detail.type === 'withdraw-popup-open') {
                const component = $('withdraw-popup-component');
                component.attr('is_allocation', e.detail.is_allocation | 0);
                component.attr('max_val', daoCore.pluginData.lockedBeams);
                component.attr('loaded', daoCore.pluginData.mainLoaded | 0);
            } else if (e.detail.type === 'calc-yeild') {
                daoCore.pluginData.yieldType = e.detail.from;

                Utils.callApi("farm_get_yield", "invoke_contract", {
                    create_tx: false,
                    args: "role=manager,action=farm_get_yield,cid=" + CONTRACT_ID + ",amount=" + 
                        e.detail.amount + ",hPeriod=" + e.detail.hPeriod
                });
            }
        });
    }
)
