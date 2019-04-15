import { h, Component } from 'preact';
import { assign } from './util'; // eslint-disable-line no-unused-vars

function callMethod(bridgeObj, method, callback) {
	if (typeof(method) === 'string' || method instanceof String) {
		return callback ? bridgeObj[method](callback) : bridgeObj[method]();
	}
	let keys = Object.keys(method);
	if (keys.length > 0){
		let suppliedArgs = method[keys[0]];
		let args = suppliedArgs.reduce((acc, arg) => [...acc, arg], callback ? [callback] : []);
		return args.length > 0 ? bridgeObj[keys[0]](...args) :  bridgeObj[keys[0]]();
	}
}

function callNoBridge(fn, method) {
	if (!fn) return;
	if (typeof(method) !== 'string' && !(method instanceof String)) {
		let keys = Object.keys(method);
		if (keys.length > 0){
			let suppliedArgs = method[keys[0]];
			return suppliedArgs.length > 0 ? fn(...suppliedArgs) :  fn();
		}
	}
	return fn();
}

function methodExists(bridgeName, method) {
	let methodName = typeof(method) === 'string' || (method instanceof String) ? method : Object.keys(method)[0];
	return window && window[bridgeName] && window[bridgeName][methodName];
}

function call(bridgeName, method, { noBridge=() => {} }={}) {
	return methodExists(bridgeName, method) && callMethod(window[bridgeName], method) || callNoBridge(noBridge, method);
}

function promise(bridgeName, method, { noBridge=() => {} }={}) {
	if (methodExists(bridgeName, method)) {
		return new Promise((resolve, reject) => {
			let callbacksObj = `${bridgeName}_callbacks`;
			if (!window[callbacksObj]) window[callbacksObj] = {};
			let callbackCount = 0;
			let callbackName = `callback_${callbackCount++}`;
			while (window[callbacksObj][callbackName]) {
				callbackName = `callback_${callbackCount++}`;
			}
			window[callbacksObj][callbackName] = {};
			window[callbacksObj][callbackName].resolve = (response) => {
				window[callbacksObj][callbackName] = null;
				resolve(response);
			};
			window[callbacksObj][callbackName].reject = (response) => {
				window[callbacksObj][callbackName] = null;
				reject(response);
			};
			let fullcallback = `window.${callbacksObj}.${callbackName}`;
			return callMethod(window[bridgeName], method, fullcallback);
		});
	}
	return Promise.resolve(callNoBridge(noBridge, method));
}

/**
 * Instantiates a bridge to an interface supplied by a wrapping native application.
 *
 * The returned object offers 2 methods:
 * call(method, options) - Calls a method designed to be called synchronously.
 * promise(method, options) - Calls a method designed to be called asynchronously, returns a promise where result can be handled.
 *
 * the method argument to both methods can be specified in different ways depending on whether
 * or not arguments are being passed:
 *
 * call('nativeMethod') calls nativeMethod with no arguments.
 * call({nativeMethod:['arg 1']}) calls nativeMethod, and passes 'arg 1' as the value for the first argument.
 *
 * The options object argument to both methods has the following properties:
 * noBridgeResponse - This value is supplied if the bridge is not available.
 *
 *
 * @param {String} bridgeName The name of the javascript interface as specified by the wrapping application.
 */
export default function bridge(bridgeName) {
	if (!bridgeName) throw new Error('bridge requires a bridgeName be submitted as the first argument. bridgeName is a constant defined by the wrapping javascript interface.');
	return {
		call: (method, options) => call(bridgeName, method, options),
		promise: (method, options) => promise(bridgeName, method, options)
	};
}

class PropsBridge extends Component {

	componentWillMount(){
		let { bridgeName } = this.props;
		if (!window || !bridgeName) return;
		let callbackName = `${bridgeName}Props`;
		if (!window[callbackName]) {
			window[callbackName] = (propsAsJson) => {
				this.setState({ bridgeProps: JSON.parse(propsAsJson) });
			};
		}
		let jsonString = bridge(bridgeName).call({ initProps: [`window.${callbackName}`] });
		jsonString && this.setState({ bridgeProps: JSON.parse(jsonString) }); //eslint-disable-line react/no-did-mount-set-state
	}

	render({ bridgeName, ChildComponent, children, ...restProps }, { bridgeProps }) {
		return h(ChildComponent, { ...restProps, ...bridgeProps });
	}
}

/**
 * Wrap a component and allow it to have it's props set by a native wrapper application.
 * @param {String} bridgeName The name of the bridge use to apply props to this component. Will be specified by the wrapper application.
 */
export function bridgeProps(fallbackBridgeName) {
	return function (Child) {
		return function ({ bridgeName, ...restProps }) { //eslint-disable-line react/display-name
			let bridgeNameToUse = bridgeName && bridgeName || fallbackBridgeName;
			if (!bridgeNameToUse) throw new Error('No bridge name has been supplied. Either pass a name to the Decorator, or supply a bridgeName prop.');
			return h(PropsBridge, { bridgeName: bridgeNameToUse, ChildComponent: Child, ...restProps });
		};
	};
}