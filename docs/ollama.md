TITLE: Installing Ollama JavaScript Library
DESCRIPTION: Installs the Ollama JavaScript library using npm, the Node.js package manager. This command adds the library as a dependency to your project.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_0

LANGUAGE: bash
CODE:

```
npm i ollama
```

---

TITLE: Performing Basic Chat with Ollama JavaScript
DESCRIPTION: Demonstrates how to send a simple chat message to an Ollama model and print the response content. It imports the library, calls the `chat` method with a model and message, and logs the result.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_1

LANGUAGE: javascript
CODE:

```
import ollama from 'ollama'

const response = await ollama.chat({
  model: 'llama3.1',
  messages: [{ role: 'user', content: 'Why is the sky blue?' }],
})
console.log(response.message.content)
```

---

TITLE: Streaming Chat Responses with Ollama JavaScript
DESCRIPTION: Illustrates how to enable and handle streaming responses from the `ollama.chat` method. Setting `stream: true` returns an AsyncGenerator, which is then iterated over to process each part of the streamed response.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_3

LANGUAGE: javascript
CODE:

```
import ollama from 'ollama'

const message = { role: 'user', content: 'Why is the sky blue?' }
const response = await ollama.chat({ model: 'llama3.1', messages: [message], stream: true })
for await (const part of response) {
  process.stdout.write(part.message.content)
}
```

---

TITLE: Generating Embeddings with Ollama in JS
DESCRIPTION: Generates embeddings for a given input using a specified model. The request object requires the 'model' name and the 'input' (string or array of strings). Optional parameters include 'truncate', 'keep_alive', and 'options'. Returns an EmbedResponse containing the generated embeddings.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_13

LANGUAGE: javascript
CODE:

```
ollama.embed(request)
```

---

TITLE: Importing Ollama Library for Browser Usage
DESCRIPTION: Shows the specific import statement required to use the Ollama JavaScript library in a browser environment, as opposed to a Node.js environment.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_2

LANGUAGE: javascript
CODE:

```
import ollama from 'ollama/browser'
```

---

TITLE: Creating a Custom Ollama Client Instance in JS
DESCRIPTION: Demonstrates how to create a custom instance of the Ollama client, allowing configuration of the host address and the fetch library used for requests. The example shows setting a specific host and then using the custom client for a chat request.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_16

LANGUAGE: javascript
CODE:

```
import { Ollama } from 'ollama';

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });
const response = await ollama.chat({
  model: 'llama3.1',
  messages: [{ role: 'user', content: 'Why is the sky blue?' }],
});
```

---

TITLE: Running Examples with tsx
DESCRIPTION: This command demonstrates how to execute a specific example file written in TypeScript using the `tsx` command-line tool. It assumes that the project has been built successfully using `npm build` as mentioned in the preceding note.
SOURCE: https://github.com/ollama/ollama-js/blob/main/examples/README.md#_snippet_0

LANGUAGE: sh
CODE:

```
npx tsx <folder-name>/<file-name>.ts
```

---

TITLE: Listing Ollama Models in JS
DESCRIPTION: Retrieves a list of all available models in Ollama. This method does not require any parameters. It returns a ListResponse object containing information about the available models.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_11

LANGUAGE: javascript
CODE:

```
ollama.list()
```

---

TITLE: Deleting an Ollama Model in JS
DESCRIPTION: Deletes an existing model from Ollama. The request object must contain the 'model' property specifying the name of the model to be deleted. Returns a status response indicating the result of the operation.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_9

LANGUAGE: javascript
CODE:

```
ollama.delete(request)
```

---

TITLE: Showing Ollama Model Information in JS
DESCRIPTION: Retrieves detailed information about a specific model in Ollama. The request object must include the 'model' name and can optionally override the system prompt, template, or provide runtime options. Returns a ShowResponse object with the model details.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_12

LANGUAGE: javascript
CODE:

```
ollama.show(request)
```

---

TITLE: Copying an Ollama Model in JS
DESCRIPTION: Copies an existing model to a new name in Ollama. The request object requires 'source' and 'destination' properties specifying the names of the model to copy from and to, respectively. Returns a status response upon completion.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_10

LANGUAGE: javascript
CODE:

```
ollama.copy(request)
```

---

TITLE: Listing Running Ollama Processes in JS
DESCRIPTION: Retrieves a list of models currently loaded and running in Ollama. This method does not require any parameters. It returns a ListResponse object similar to the 'list' method, but focused on active processes.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_14

LANGUAGE: javascript
CODE:

```
ollama.ps()
```

---

TITLE: Creating an Ollama Model in JS
DESCRIPTION: Initiates the creation of a new model in Ollama using the provided request parameters. The request object specifies the model name, base model, streaming options, quantization, template, license, system prompt, additional parameters, initial messages, and adapters. Note that the 'files' parameter is not supported.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_8

LANGUAGE: javascript
CODE:

```
ollama.create(request)
```

---

TITLE: Aborting All Ollama Streams in JS
DESCRIPTION: Aborts all currently running streamed generations associated with the client instance. This causes asynchronous threads listening to streams (e.g., `for await`) to throw an `AbortError`. For stream-specific timeouts, use separate client instances.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_15

LANGUAGE: javascript
CODE:

```
ollama.abort()
```

---

TITLE: Ollama JavaScript pull API Method Signature
DESCRIPTION: Defines the signature for the `ollama.pull` method, used to download a model from a registry. It accepts a request object specifying the model name and optional parameters, returning a ProgressResponse or an AsyncGenerator.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_6

LANGUAGE: javascript
CODE:

```
ollama.pull(request)
```

---

TITLE: Ollama JavaScript chat API Method Signature
DESCRIPTION: Defines the signature for the `ollama.chat` method, which is used to interact with a model in a conversational manner. It accepts a request object containing model, messages, and optional parameters, returning a ChatResponse or an AsyncGenerator if streaming is enabled.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_4

LANGUAGE: javascript
CODE:

```
ollama.chat(request)
```

---

TITLE: Ollama JavaScript generate API Method Signature
DESCRIPTION: Defines the signature for the `ollama.generate` method, used for generating text based on a prompt. It takes a request object with model, prompt, and optional parameters, returning a GenerateResponse or an AsyncGenerator.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_5

LANGUAGE: javascript
CODE:

```
ollama.generate(request)
```

---

TITLE: Ollama JavaScript push API Method Signature
DESCRIPTION: Defines the signature for the `ollama.push` method, used to upload a model to a registry. It takes a request object with the model name and optional parameters, returning a ProgressResponse or an AsyncGenerator.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_7

LANGUAGE: javascript
CODE:

```
ollama.push(request)
```

---

TITLE: Building the Ollama JS Project
DESCRIPTION: Provides the command to build the project files for the ollama-js library. This command typically compiles source code, bundles assets, and prepares the library for distribution or use.
SOURCE: https://github.com/ollama/ollama-js/blob/main/README.md#_snippet_17

LANGUAGE: sh
CODE:

```
npm run build
```
