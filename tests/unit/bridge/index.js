import bridge, { bridgeProps } from '../../../src/';
import { deep } from 'preact-render-spy';

const validBridgeName = 'testBridge';
const testMethod = 'testMethod';

describe('bridge()', () => {

	it(`Should throw error if instantiated without a bridge name.`, () => {
		expect(() => bridge()).toThrow();
		expect(() => bridge(validBridgeName)).not.toThrow();
	});

	it(`Should return an object with a call and promise method when called with a valid bridgeName.`, () => {
		expect(bridge(validBridgeName))
			.toEqual(expect.objectContaining({
				call: expect.any(Function),
				promise: expect.any(Function)
			}));
	});

	describe(`call()`, () => {

		it(`Should return a falsy value when using call() on a bridge that does not exist.`, () => {
			expect(window).toBeTruthy();
			let testBridge = bridge(validBridgeName);
			expect(testBridge.call(testMethod)).toBeFalsy();
			expect(testBridge.call({ testMethod: ['arg1', 'arg2'] })).toBeFalsy();
		});

		it(`Should call noBridge option function when using call() on a bridge that does not exist.`, () => {
			window[validBridgeName] = null;
			expect(window).toBeTruthy();
			let testBridge = bridge(validBridgeName);
			let responseVal = 'hello world';
			let args = ['arg1', 'arg2'];
			let noBridgeFn = jest.fn(() => responseVal);
			expect(testBridge.call({ [testMethod]: args }, { noBridge: noBridgeFn })).toEqual(responseVal);
			expect(noBridgeFn).toBeCalledWith(...args);
		});

		it(`Should call noBridge option function when using call() on a bridge that does exist but a method that does not.`, () => {
			expect(window).toBeTruthy();
			window[validBridgeName] = {
                
			};
			let testBridge = bridge(validBridgeName);
			let responseVal = 'hello world';
			let args = ['arg1', 'arg2'];
			let noBridgeFn = jest.fn(() => responseVal);
			expect(testBridge.call({ [testMethod]: args }, { noBridge: noBridgeFn })).toEqual(responseVal);
			expect(noBridgeFn).toBeCalledWith(...args);
			window[validBridgeName] = null;
		});
        
		it(`Should call javascript interface method as result of using call().`, () => {
			expect(window).toBeTruthy();
			window[validBridgeName] = {
				[testMethod]: jest.fn()
			};
			let testBridge = bridge(validBridgeName);
			testBridge.call(testMethod);
			expect(window[validBridgeName][[testMethod]]).toHaveBeenCalled();
			window[validBridgeName] = null;
		});

		it(`Should call javascript interface method as result of using call() with arguments.`, () => {
			expect(window).toBeTruthy();
			window[validBridgeName] = {
				[testMethod]: jest.fn()
			};
			let args = ['arg1','arg2'];
			let testBridge = bridge(validBridgeName);
			testBridge.call({ [testMethod]: args });
			expect(window[validBridgeName][testMethod]).toHaveBeenCalledWith(...args);
			window[validBridgeName] = null;
		});

		it(`Should call javascript interface method as result of using call() and have a value returned.`, () => {
			expect(window).toBeTruthy();
			let resultValue = 'hello world';
			window[validBridgeName] = {
				[testMethod]: jest.fn(() => resultValue)
			};
			let testBridge = bridge(validBridgeName);
			expect(testBridge.call(testMethod)).toEqual(resultValue);
			window[validBridgeName] = null;
		});

		it(`Should call javascript interface method as result of using call() with arguments and returning a value.`, () => {
			expect(window).toBeTruthy();
			window[validBridgeName] = {
				[testMethod]: jest.fn((arg1,arg2) => `${arg1}${arg2}`)
			};
			let args = ['arg1','arg2'];
			let testBridge = bridge(validBridgeName);
			expect(testBridge.call({ [testMethod]: args })).toEqual(args.reduce((acc, item) => `${acc}${item}`),'');
			expect(window[validBridgeName][testMethod]).toHaveBeenCalledWith(...args);
			window[validBridgeName] = null;
		});
	});

	describe(`promise()`, () => {
		it(`Should return a falsy value when using promise() on a bridge that does not exist.`, async () => {
			expect(window).toBeTruthy();
			let testBridge = bridge(validBridgeName);
			expect(await testBridge.promise(testMethod)).toBeFalsy();
		});

		it(`Should call noBridge option function when using promise() on a bridge that does not exist.`, async() => {
			window[validBridgeName] = null;
			expect(window).toBeTruthy();
			let testBridge = bridge(validBridgeName);
			let responseVal = 'hello world';
			let args = ['arg1', 'arg2'];
			let noBridgeFn = jest.fn(() => responseVal);
			expect(await testBridge.promise({ [testMethod]: args }, { noBridge: noBridgeFn })).toEqual(responseVal);
			expect(noBridgeFn).toBeCalledWith(...args);
		});

		it(`Should call noBridge option function when using promise() on a bridge that does exist but a method that does not.`, async () => {
			expect(window).toBeTruthy();
			window[validBridgeName] = {
                
			};
			let testBridge = bridge(validBridgeName);
			let responseVal = 'hello world';
			let args = ['arg1', 'arg2'];
			let noBridgeFn = jest.fn(() => responseVal);
			expect(await testBridge.promise({ [testMethod]: args }, { noBridge: noBridgeFn })).toEqual(responseVal);
			expect(noBridgeFn).toBeCalledWith(...args);
			window[validBridgeName] = null;
		});

		function resolvePromise(pathToPromise, args) {
			let [windowRef, ...pathLessWindow] = pathToPromise.split('.');
			let callbacksRef = pathLessWindow.reduce((ref, pathStep) => ref[pathStep], window);
			args ? callbacksRef.resolve(...args) : callbacksRef.resolve();
		}

		function rejectPromise(pathToPromise, args) {
			let [windowRef, ...pathLessWindow] = pathToPromise.split('.');
			let callbacksRef = pathLessWindow.reduce((ref, pathStep) => ref[pathStep], window);
			args ? callbacksRef.reject(...args) : callbacksRef.reject();
		}

		it(`Should call javascript interface method using promise() and have a resolve occur.`, async () => {
			expect(window).toBeTruthy();
			window[validBridgeName] = {
				[testMethod]: jest.fn((pathToPromise => {
					resolvePromise(pathToPromise);
				}))
			};
			let testBridge = bridge(validBridgeName);
			await testBridge.promise(testMethod);
			expect(window[validBridgeName][[testMethod]]).toHaveBeenCalled();
			window[validBridgeName] = null;
		});

		it(`Should call javascript interface method using promise() and have a reject occur.`, async () => {
			expect(window).toBeTruthy();
			window[validBridgeName] = {
				[testMethod]: jest.fn((pathToPromise => {
					rejectPromise(pathToPromise);
				}))
			};
			let testBridge = bridge(validBridgeName);
			expect(await testBridge.promise(testMethod).catch(() => true)).toBeTruthy();
			expect(window[validBridgeName][[testMethod]]).toHaveBeenCalled();
			window[validBridgeName] = null;
		});

		it(`Should call javascript interface method using promise() with arguments and have a resolve occur.`, async () => {
			expect(window).toBeTruthy();
			window[validBridgeName] = {
				[testMethod]: jest.fn((pathToPromise => {
					resolvePromise(pathToPromise);
				}))
			};
			let args = ['arg1','arg2'];
			let testBridge = bridge(validBridgeName);
			await testBridge.promise({ [testMethod]: args });
			expect(window[validBridgeName][testMethod]).toHaveBeenCalledWith(...[expect.anything() ,...args]);
			window[validBridgeName] = null;
		});

		it(`Should call javascript interface method using promise() and have a value returned from resolve`, async () => {
			expect(window).toBeTruthy();
			let resultValue = 'hello world';
			window[validBridgeName] = {
				[testMethod]: jest.fn((pathToPromise => {
					resolvePromise(pathToPromise, [resultValue]);
				}))
			};
			let testBridge = bridge(validBridgeName);
			expect(await testBridge.promise(testMethod)).toEqual(resultValue);
			window[validBridgeName] = null;
		});

		it(`Should call javascript interface method using promise() with arguments and returning a value from resolve.`, async () => {
			expect(window).toBeTruthy();
			window[validBridgeName] = {
				[testMethod]: jest.fn(((pathToPromise, arg1, arg2) => {
					resolvePromise(pathToPromise, [`${arg1}${arg2}`]);
				}))
			};
			let args = ['arg1','arg2'];
			let testBridge = bridge(validBridgeName);
			expect(await testBridge.promise({ [testMethod]: args })).toEqual(args.reduce((acc, item) => `${acc}${item}`),'');
			expect(window[validBridgeName][testMethod]).toHaveBeenCalledWith(...[expect.anything(), ...args]);
			window[validBridgeName] = null;
		});
	});
});


describe('bridgeProps()', () => {

	function MyComponent({ title }) {
		return <h1>{title}</h1>;
	}

	it(`Should error if no bridge name is supplied.`, () => {
		let WrappedComponent = bridgeProps()(MyComponent);
		expect(() => deep(<WrappedComponent />)).toThrow();
	});

	it(`Should not error if a bridge name is supplied via decorator.`, () => {
		let WrappedComponent = bridgeProps(validBridgeName)(MyComponent);
		expect(() => deep(<WrappedComponent />)).not.toThrow();
	});

	it(`Should not error if a bridge name is supplied via bridgeName prop.`, () => {
		let WrappedComponent = bridgeProps()(MyComponent);
		expect(() => deep(<WrappedComponent bridgeName={validBridgeName} />)).not.toThrow();
	});
    
	it(`Should propagte props to wrapped component.`, () => {
		let testProps = {
			title: 'Hello World',
			testProp1: 'test 1',
			testProp2: 'test 2'
		};
		let spyComponent = jest.fn(MyComponent);
		let WrappedComponent = bridgeProps(validBridgeName)(spyComponent);
		deep(<WrappedComponent {...testProps} />);
		expect(spyComponent).toHaveBeenCalledWith(expect.objectContaining(testProps), expect.anything());
	});

	it(`Should not propagate bridgeName if supplied as prop.`, () => {
		let testProps = {
			title: 'Hello World',
			bridgeName: validBridgeName
		};
		let spyComponent = jest.fn(MyComponent);
		let WrappedComponent = bridgeProps()(spyComponent);
		deep(<WrappedComponent {...testProps} />);
		expect(spyComponent).toHaveBeenCalledWith(
			expect.not.objectContaining({
				bridgeName: validBridgeName
			}),
			expect.anything()
		);
	});

	function updateProps(pathToProps, result) {
		let [windowRef, ...pathLessWindow] = pathToProps.split('.');
		let callbackRef = pathLessWindow.reduce((ref, pathStep) => ref[pathStep], window);
		result ? callbackRef(JSON.stringify(result)) : callbackRef();
	}

	it(`Should allow valid bridgeProps jsInterface to set props on target component using initProps.`, () => {
		let initProps = {
			title: 'Hello World'
		};

		let jsInterface = {
			initProps: () => JSON.stringify(initProps)
		};
		expect(window).toBeTruthy();
		window[validBridgeName] = jsInterface;

		let spyComponent = jest.fn(MyComponent);
		let WrappedComponent = bridgeProps(validBridgeName)(spyComponent);
		deep(<WrappedComponent />);
		expect(spyComponent).toHaveBeenCalledWith(
			expect.objectContaining(initProps),
			expect.anything()
		);
	});

	it(`Should allow valid bridgeProps jsInterface to set props on target component.`, () => {
		let initProps = {
			title: 'Hello World'
		};
		let propsPath = '';

		let jsInterface = {
			initProps: ( setPropsPath ) => {
				propsPath = setPropsPath;
			},
			setProps: (props) => {
				updateProps(propsPath, props);
			}
		};
		expect(window).toBeTruthy();
		window[validBridgeName] = jsInterface;

		let spyComponent = jest.fn(MyComponent);
		let WrappedComponent = bridgeProps(validBridgeName)(spyComponent);
		deep(<WrappedComponent />);

		jsInterface.setProps(initProps);
		setTimeout(() => {
			expect(spyComponent).toHaveBeenLastCalledWith(
				expect.objectContaining(initProps),
				expect.anything()
			);
		}, 100);
	});
});