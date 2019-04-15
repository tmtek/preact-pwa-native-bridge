# Preact Native Bridge

The Preact Native Bridge is a simple javascript bridge implementation that allows a wrapping application to communicate with a [Preact](https://preactjs.com/) app. This bridge maintains the philosophy of "props down, events up" by implementing a decorator that allows the wrapping application to set props directly on components.

### Installation 

```
npm i preact-pwa-native-bridge
```

## bridge(bridgeName)

The bridge function allows you to instantiate an object that allows methods of a javascript interface to be called.

*bridgeName*: The function must be supplied the name of the javascript interface as an argument. This name is defined by the wrapping application.

```javascript
import bridge from 'preact-pwa-native-bridge';

const bridgeExampleApi = bridge('exampleAPI');
const bridgeAnotherApi = bridge('anotherAPI');
```


### call("method"|{method:[...args]}, {options})

the call() method of bridge() calls a method of the wrapper's javascript interface synchronously. You may submit any arguments you wish, and anything returned by the method of the javascript interface will be returned:

```javascript
const bridgeExampleApi = bridge('exampleAPI');
bridgeExampleApi.call('methodWithNoArguments');
bridgeExampleApi.call({methodWithArguments:['arg 1', true]});
let data  = bridgeExampleApi.call('methodThatReturnsData');
```

### promise("method"|{method:[...args]}, {options})

The promise() method of bridge() calls a method of the wrapper's javascript interface and facilitates an asynchronous response by returning a Promise object:

```javascript
const bridgeExampleApi = bridge('exampleAPI');

bridgeExampleApi
	.promise('methodWithNoArguments')
	.then(response => console.log(`Response:${response}`))
	.catch(error => console.log(`Error:${error}`));
	
bridgeExampleApi
	.promise({methodWithArguments:['arg 1', true]})
	.then(response => console.log(`Response:${response}`))
	.catch(error => console.log(`Error:${error}`));
```

### Options

Both call() and promise() have an optional options object that can be passed as the second argument. the options object has the following properties:

* noBridge: Supply a function that will be called if the bridge is not defined. The function can return a value used in place of the return value of the original call.

```javascript
const bridgeExampleApi = bridge('exampleAPI');
let message = bridgeExampleApi.call(
	'getMessage', 
	{ noBridge:() => `No Bridge...` }
);
```

## @bridgeProps()

The bridgeProps decorator allows you to specify that a component's props can be set by the wrapping application.

The following example demonstrates wrapping a Component with bridgeProps() which links it to a named javascript interface that allows the wrapper to set the props of the component:

```javascript
@bridgeProps('AppProps')
export default class App extends Component {
	render({ title }) {
		return <h1>{title}</h1>
	}
}
```
In the example above, the first instance of App will be linked to the bridge named 'AppProps', but a second+ will not establish a link. A bridge can only support one component instance. 

If you want to bridge props on a component that will have multiple instances, you can use the `bridgeName` prop:

```javascript
@bridgeProps()
export default class MultiInstanceComponent extends Component {
	render({ title }) {
		return <h1>{title}</h1>
	}
}

<MultiInstanceComponent bridgeName="Inst1Props" />
<MultiInstanceComponent bridgeName="Inst2Props" />
```

Once a component has been wrapped, and it's bridgeName has been specified, the wrapping application will be able to set any props on this component at any time.

## Wrapper Compliance

If you are implementing the bridge on the native side, there is an interface that you must support to be compliant with preact-native-bridge.


### Supporting bridge()

In order to support bridge, you must be able to inject a javascript interface into a webview. The javascript interface should be injected as a named object onto the DOM's window object:

```javascript
window['YourJSInterfaceName'] = {} //<--Your injected interface
``` 
'YourJSInterfaceName' will be the same name that the Preact app will refer to it by: 

```javascript
let myBridge = bridge('YourJSInterfaceName');
```

### Supporting call()

 There is nothing special that needs to be done to support call(). Any function you apply to your javascript interface can recieve arguments and return values in the standard way.
 
Only primitive data types such as strings, numbers, and booleans can be returned. Any object type data that you return should be encoded as a JSON string.

Here is an example in Java:

```java
@JavascriptInterface
public String callExample(final String arg1) {
	return "You submitted:" + arg1 + " to the wrapper.";
}
```


### Supporting promise()

Any javascript interface function that is intended to be used with promise() will get special arguments submitted to it:

* first argument is the path to the callback functions as a string.
* Then all arguments are supplied in order of submission.
* No value need be returned.
* The promise can be satisfied immediately or at any time in the future.

Here is an example in Java:

```java
@JavascriptInterface
public void promiseExample(final String promise, final String arg1) {

}
```

To satisfy the promise, you have to use the promise string submitted to you as the first argument. When you are ready to return a value, you will have to use that string to build a javascript call into the web view that targets either the resolve() or reject() function of the promise located at the reference supplied to you.

Theoretically, that would look like this in Java:

```java
@JavascriptInterface
public void promiseExample(final String promise, final String arg1) {
	final String jsToResolve = ".resolve(\"Response from Wrapper!\")";
	final String jsToReject = ".reject(\"Error from Wrapper\")";
	webView.evaluateJavascript("javascript:" + promise + jsToResolve, null);
}
```

### Supporting bridgeProps()

The bridgeProps decorator is supported by a javascript interface and requires at least one method to be implemented on the javascript interface to function correctly.

When a component is wrapped by `bridgeProps('JSInterfaceName')`, it will call out to a method called `initProps(callback)` when it initializes:

An example in Java:

```java
@JavascriptInterface
public String initProps(final String propsSetCallback) {
	mPropsSetCallback = propsSetCallback;
	if (mProps != null) {
		return new Gson().toJson(mProps);
	}
	return "{}";
}
```
initProps takes one argument that is a path to a function you can call at any time to set the props for the wrapped component. 

It also allows you to return json encoded as a string that will be combined/overwrite existing props of the component on startup.

To set the props in the future (Java example):

```java
public void updateProps(final Props props) {
	final String jsToResolve = mPropsSetCallback + "(\""+ new Gson().toJson(props) +"\")";
	webView.evaluateJavascript("javascript:" + jsToResolve, null);
}
```