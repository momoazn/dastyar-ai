TITLE: Implementing Basic PocketBase Server with Custom Route in Go
DESCRIPTION: Demonstrates how to create a minimal PocketBase server implementation with a custom 'hello world' route. Includes initialization of the PocketBase app and event binding for server customization.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/README.md#2025-04-22_snippet_0

LANGUAGE: go
CODE:

```
package main

import (
    "log"

    "github.com/pocketbase/pocketbase"
    "github.com/pocketbase/pocketbase/core"
)

func main() {
    app := pocketbase.New()

    app.OnServe().BindFunc(func(se *core.ServeEvent) error {
        // registers new "GET /hello" route
        se.Router.GET("/hello", func(re *core.RequestEvent) error {
            return re.String(200, "Hello world!")
        })

        return se.Next()
    })

    if err := app.Start(); err != nil {
        log.Fatal(err)
    }
}
```

---

TITLE: Programmatic API Server Initialization in Go
DESCRIPTION: Shows how to start the PocketBase API server programmatically using the apis.Serve helper. This allows for more flexibility when integrating PocketBase within a larger application.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_20

LANGUAGE: go
CODE:

```
apis.Serve(app, options)
```

---

TITLE: Serving PocketBase with Custom Domain (Shell)
DESCRIPTION: Example of how to serve PocketBase with a custom domain name using the simplified 'serve' command.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_9

LANGUAGE: sh
CODE:

```
./pocketbase serve yourdomain.com
```

---

TITLE: Querying Records with Fields Parameter Example in JavaScript
DESCRIPTION: Demonstrates how to use the fields parameter to limit returned API fields in a PocketBase query. This helps reduce response payload size by selecting only needed fields from records and expanded relations.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_15

LANGUAGE: javascript
CODE:

```
// original: {"id": "RECORD_ID", "name": "abc", "description": "...something very big...", "items": ["id1", "id2"], "expand": {"items": [{"id": "id1", "name": "test1"}, {"id": "id2", "name": "test2"}]}}
// output:   {"name": "abc", "expand": {"items": [{"name": "test1"}, {"name": "test2"}]}}
const result = await pb.collection("example").getOne("RECORD_ID", {
  expand: "items",
  fields: "name,expand.items.name",
})
```

---

TITLE: Using DAO Record Helpers in Go
DESCRIPTION: Examples of using new DAO helper methods in PocketBase for finding records by filter, checking record access, and creating a DAO without hooks.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_14

LANGUAGE: go
CODE:

```
app.Dao().FindRecordsByFilter("posts", "title ~ 'lorem ipsum' && visible = true", "-created", 10)
app.Dao().FindFirstRecordByFilter("posts", "slug='test' && active=true")
app.Dao().CanAccessRecord(record, requestInfo, rule)
app.Dao().WithoutHooks()
```

---

TITLE: Using PocketBase Tagged Event Hooks in Go
DESCRIPTION: Example of using the new tagged event hooks feature in PocketBase that allows registering event handlers for specific collections by name or ID.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_4

LANGUAGE: go
CODE:

```
app.OnRecordBeforeCreateRequest("articles").Add(func(e *core.RecordCreateEvent) error {
  // called only on "articles" record creation
  log.Println(e.Record)
  return nil
})
```

---

TITLE: JavaScript Migration Example
DESCRIPTION: Sample JavaScript migration file showing collection name update with up and down migration handlers.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_14

LANGUAGE: javascript
CODE:

```
migrate((db) => {
    // up
    const dao = new Dao(db)
    const collection = dao.findCollectionByNameOrId("lngf8rb3dqu86r3")
    collection.name = "posts_new"
    return dao.saveCollection(collection)
}, (db) => {
    // down
    const dao = new Dao(db)
    const collection = dao.findCollectionByNameOrId("lngf8rb3dqu86r3")
    collection.name = "posts_old"
    return dao.saveCollection(collection)
})
```

---

TITLE: Realtime Subscription with Query Parameters in JavaScript SDK
DESCRIPTION: Demonstrates how to use the new expand, filter, fields and custom query parameters with realtime subscriptions in JavaScript SDK v0.20.0+. This allows for more specific data filtering during live updates.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_2

LANGUAGE: javascript
CODE:

```
// JS SDK v0.20.0
pb.collection("example").subscribe("*", (e) => {
  ...
}, {
  expand: "someRelField",
  filter: "status = 'active'",
  fields: "id,expand.someRelField.*:excerpt(100)",
})
```

---

TITLE: Migration Registration in Go
DESCRIPTION: Example of registering migrations in PocketBase application with support for JavaScript migrations.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_13

LANGUAGE: go
CODE:

```
migrationsDir := "" // default to "pb_migrations" (for js) and "migrations" (for go)

// load js files if you want to allow loading external JavaScript migrations
jsvm.MustRegisterMigrations(app, &jsvm.MigrationsOptions{
    Dir: migrationsDir,
})

// register the `migrate` command
migratecmd.MustRegister(app, app.RootCmd, &migratecmd.Options{
    TemplateLang: migratecmd.TemplateLangJS, // or migratecmd.TemplateLangGo (default)
    Dir:          migrationsDir,
    Automigrate:  true,
})
```

---

TITLE: Using HMAC and String Comparison in JSVM
DESCRIPTION: Demonstrates the use of newly exposed crypto primitives in the JSVM $security namespace. This includes HMAC with SHA256 and SHA512, as well as constant-time string comparison.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_8

LANGUAGE: javascript
CODE:

```
// HMAC with SHA256
$security.hs256("hello", "secret")

// HMAC with SHA512
$security.hs512("hello", "secret")

// compare 2 strings with a constant time
$security.equal(hash1, hash2)
```

---

TITLE: Using Placeholders in Dao.FindRecordsByFilter (Go)
DESCRIPTION: Example of using the new placeholder params argument in Dao.FindRecordsByFilter to safely handle untrusted user input.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_10

LANGUAGE: go
CODE:

```
app.Dao().FindRecordsByFilter("articles", "status={:status} && author={:author}", "-created", 10, 0, dbx.Params{
  "status": status,
  "author": author,
})
```

---

TITLE: Installing Latest JavaScript SDK for PocketBase
DESCRIPTION: Command to install the latest version of the PocketBase JavaScript SDK via npm. Users should check the JavaScript SDK changelog for specific changes.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_15

LANGUAGE: sh
CODE:

```
npm install pocketbase@latest --save
```

---

TITLE: Installing Dart SDK for PocketBase
DESCRIPTION: Commands to install the PocketBase Dart SDK version 0.5.0 or above using either dart pub or flutter pub. Users should reference the Dart SDK changelog for specific changes.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_16

LANGUAGE: sh
CODE:

```
dart pub add pocketbase:^0.5.0
# or with Flutter:
flutter pub add pocketbase:^0.5.0
```

---

TITLE: Programmatic Backup Creation in Go
DESCRIPTION: Shows how to programmatically create a backup of the PocketBase data directory. This snippet demonstrates using the App.CreateBackup method to generate a backup archive.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_18

LANGUAGE: go
CODE:

```
app.CreateBackup("backup.zip")
```

---

TITLE: Updating Multiple File Fields in PocketBase Web API (JSON)
DESCRIPTION: Demonstrates how to replace, prepend, or append files when updating a multiple file field via the Web API in PocketBase v0.23+. Previously, new files were always appended; now they replace existing ones unless the '+' prefix/suffix is used.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG.md#_snippet_3

LANGUAGE: JSON
CODE:

```
"documents": [file1, file2]  // => [file1_name, file2_name]
```

LANGUAGE: JSON
CODE:

```
"+documents": [file1, file2] // => [file1_name, file2_name, old1_name, old2_name]
```

LANGUAGE: JSON
CODE:

```
"documents+": [file1, file2] // => [old1_name, old2_name, file1_name, file2_name]
```

---

TITLE: Using PocketBase Update Command in Shell
DESCRIPTION: Examples of using the new self-update command to update a PocketBase executable. This command allows updating PocketBase to the latest version with automatic backup capability.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_16

LANGUAGE: shell
CODE:

```
./pocketbase update
```

---

TITLE: PocketBase Admin Management Commands in Shell
DESCRIPTION: Examples of using the new admin command to create, update, or delete administrator accounts from the command line. This is useful for scripting and automation of admin management tasks.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_17

LANGUAGE: shell
CODE:

```
// creates new admin account
./pocketbase admin create test@example.com 123456890

// changes the password of an existing admin account
./pocketbase admin update test@example.com 0987654321

// deletes single admin account (if exists)
./pocketbase admin delete test@example.com
```

---

TITLE: Demonstrating Field Modifiers in JavaScript
DESCRIPTION: Shows how to use the new '+' and '-' body field modifiers for number, files, select and relation fields. These modifiers allow for incrementing/decrementing numbers and adding/removing items from arrays.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_5

LANGUAGE: javascript
CODE:

```
{
  // oldValue + 2
  "someNumber+": 2,

  // oldValue + ["id1", "id2"] - ["id3"]
  "someRelation+": ["id1", "id2"],
  "someRelation-": ["id3"],

  // delete single file by its name (file fields supports only the "-" modifier!)
  "someFile-": "filename.png",
}
```

---

TITLE: PocketBase Web API Error Response Structure (JSON)
DESCRIPTION: Illustrates the updated structure of error responses in the PocketBase Web API (v0.23+), showing the change of the top-level 'code' key to 'status' for consistency with Go APIs. The error field key remains 'code'.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG.md#_snippet_4

LANGUAGE: JSON
CODE:

```
{
    "status": 400, // <-- old: "code"
    "message": "Failed to create record.",
    "data": {
        "title": {
            "code": "validation_required",
            "message": "Missing required value."
        }
    }
}
```

---

TITLE: PocketBase Web API Auth Methods Response Structure (JSON)
DESCRIPTION: Shows the new structure of the response from the GET /api/collections/{collection}/auth-methods endpoint in PocketBase v0.23+, including new fields like 'mfa' and 'otp'. Old fields ('authProviders', 'usernamePassword', 'emailPassword') are deprecated but still returned.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG.md#_snippet_5

LANGUAGE: JSON
CODE:

```
{
    "mfa": {
        "duration": 100,
        "enabled": true
    },
    "otp": {
        "duration": 0,
        "enabled": false
    },
    "password": {
        "enabled": true,
        "identityFields": ["email", "username"]
    },
    "oauth2": {
        "enabled": true,
        "providers": [{"name": "gitlab", ...}, {"name": "google", ...}]
    },
    // old fields...
}
```

---

TITLE: Using the New Logger Implementation in Go
DESCRIPTION: Demonstrates the usage of the new app.Logger() which implements standard log/slog interfaces in Go 1.21. This example shows how to log info messages with structured data.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_4

LANGUAGE: text
CODE:

```
// Go: https://pocketbase.io/docs/go-logging/
app.Logger().Info("Example message", "total", 123, "details", "lorem ipsum...")
```

---

TITLE: Accessing Expanded Relations in Go
DESCRIPTION: Helper methods to retrieve casted single or multiple expand relations from already loaded 'expand' Record data in PocketBase.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_13

LANGUAGE: go
CODE:

```
record.ExpandedOne(rel)
record.ExpandedAll(rel)
```

---

TITLE: Updating Mailer Message Structure in Go
DESCRIPTION: Example showing how to migrate from the old mailer.Message structure to the new one which changed To, Cc, and Bcc fields to use []mail.Address type for consistency and to allow multiple recipients with optional names.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_3

LANGUAGE: go
CODE:

```
message := &mailer.Message{
  ...

  // (old) To: mail.Address{Address: "to@example.com"}
  To: []mail.Address{{Address: "to@example.com", Name: "Some optional name"}},

  // (old) Cc: []string{"cc@example.com"}
  Cc: []mail.Address{{Address: "cc@example.com", Name: "Some optional name"}},

  // (old) Bcc: []string{"bcc@example.com"}
  Bcc: []mail.Address{{Address: "bcc@example.com", Name: "Some optional name"}},

  ...
}
```

---

TITLE: Realtime Subscription with Query Parameters in Dart SDK
DESCRIPTION: Shows how to implement realtime subscriptions with expand, filter, and fields parameters in Dart SDK v0.17.0+. This enables filtered realtime data syncing with specific field selection.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_3

LANGUAGE: dart
CODE:

```
// Dart SDK v0.17.0
pb.collection("example").subscribe("*", (e) {
    ...
  },
  expand: "someRelField",
  filter: "status = 'active'",
  fields: "id,expand.someRelField.*:excerpt(100)",
)
```

---

TITLE: Initialize PocketBase JSVM DateTime with Timezone
DESCRIPTION: This JavaScript snippet illustrates the new capability in PocketBase v0.27.0's JSVM `DateTime` constructor to accept a timezone identifier (like "Europe/Amsterdam") as a second argument. This allows for more accurate date parsing that accounts for daylight saving time nuances, providing an alternative to using fixed UTC offsets.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG.md#_snippet_1

LANGUAGE: javascript
CODE:

```
// the same as with CET offset: new DateTime("2025-10-26 03:00:00 +01:00")
new DateTime("2025-10-26 03:00:00", "Europe/Amsterdam") // 2025-10-26 02:00:00.000Z

// the same as with CEST offset: new DateTime("2025-10-26 01:00:00 +02:00")
new DateTime("2025-10-26 01:00:00", "Europe/Amsterdam") // 2025-10-25 23:00:00.000Z
```

---

TITLE: Using the New Logger Implementation in JavaScript
DESCRIPTION: Shows how to use the new logger functionality in JavaScript with PocketBase. The logger supports structured logging with a similar API to the Go implementation.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_5

LANGUAGE: javascript
CODE:

```
// JS: https://pocketbase.io/docs/js-logging/
$app.logger().info("Example message", "total", 123, "details", "lorem ipsum...")
```

---

TITLE: Accessing Custom Record Fields in Go
DESCRIPTION: Methods for accessing and controlling serialization of unknown/custom fields in Record models. These helpers allow developers to handle custom data that isn't part of the standard Record schema.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_18

LANGUAGE: go
CODE:

```
func (m *Record) UnknownData() map[string]any
func (m *Record) WithUnknownData(state bool)
```

---

TITLE: Accessing Original Filename in Filesystem
DESCRIPTION: Example showing how to access the original uploaded filename stored in file metadata.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_12

LANGUAGE: go
CODE:

```
fs, _ := app.NewFilesystem()
defer fs.Close()

attrs, _ := fs.Attributes(fikeKey)
attrs.Metadata["original_name"]
```

---

TITLE: Using :isset Modifier for Static Request Data Fields in JavaScript
DESCRIPTION: Demonstrates the use of the :isset modifier for static request data fields, which can be used to prevent changing specific fields.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_8

LANGUAGE: javascript
CODE:

```
// prevent changing the "role" field
@request.data.role:isset = false
```

---

TITLE: Using :each Modifier for Multi-select Fields in JavaScript
DESCRIPTION: Demonstrates the use of the :each modifier for multi-select request data and collection fields, allowing conditions to be applied to each item in the array.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_10

LANGUAGE: javascript
CODE:

```
// check if all selected rows has "pb_" prefix
roles:each ~ 'pb_%'
```

---

TITLE: Applying :length Modifier to Arrayable Fields in JavaScript
DESCRIPTION: Shows how to use the :length modifier for arrayable request data and collection fields (select, file, relation) to check the length of the array.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_9

LANGUAGE: javascript
CODE:

```
// example submitted data: {"someSelectField": ["val1", "val2"]}
@request.data.someSelectField:length = 2

// check existing record field length
someSelectField:length = 2
```

---

TITLE: Programmatic Backup Restoration in Go
DESCRIPTION: Demonstrates how to restore a PocketBase backup programmatically. Note that this feature is experimental and currently works only on UNIX systems as it relies on execve.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_19

LANGUAGE: go
CODE:

```
app.RestoreBackup("backup.zip")
```

---

TITLE: Querying Request Data Relation Fields in JavaScript
DESCRIPTION: Shows how to query @request.data.someRelField.\* relation fields, allowing access to related record fields in API rules.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_7

LANGUAGE: javascript
CODE:

```
// example submitted data: {"someRel": "REL_RECORD_ID"}
@request.data.someRel.status = "active"
```

---

TITLE: Implementing Multi-Match Conditions in JavaScript
DESCRIPTION: Demonstrates how to use multi-match/match-all request data and collection multi-valued fields conditions. The '?' prefix is used for 'at least one of' type conditions.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_6

LANGUAGE: javascript
CODE:

```
// for each someRelA.someRelB record require the "status" field to be "active"
someRelA.someRelB.status = "active"

// OR for "at least one of" condition
someRelA.someRelB.status ?= "active"
```

---

TITLE: Updating Record Model in Go
DESCRIPTION: Code snippet for triggering related Record model realtime subscription events on custom model struct save.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_0

LANGUAGE: go
CODE:

```
Trigger the related `Record` model realtime subscription events on [custom model struct](https://pocketbase.io/docs/custom-models/) save
```

---

TITLE: Using Raw Template Function in JSVM
DESCRIPTION: Shows how to use the new global 'raw' template function in JSVM templates to output raw/verbatim HTML content. This is useful when you need to include unescaped HTML in your template output.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_7

LANGUAGE: javascript
CODE:

```
{{.description|raw}}
```

---

TITLE: Registering JavaScript VM Plugin in Go
DESCRIPTION: Code snippet showing how to register the JavaScript VM plugin for custom Go builds of PocketBase. This allows enabling JavaScript app hooks for dynamic scripting.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_12

LANGUAGE: go
CODE:

```
jsvm.MustRegister(app core.App, config jsvm.Config{})
```

---

TITLE: Updating JsonArray Type in Go
DESCRIPTION: Change to types.JsonArray to support specifying a generic type.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_2

LANGUAGE: go
CODE:

```
Changed `types.JsonArray` to support specifying a generic type, aka. `types.JsonArray[T]`.
If you have previously used `types.JsonArray`, you'll have to update it to `types.JsonArray[any]`.
```

---

TITLE: Installing Dependencies and Running Development Server for PocketBase UI in Shell
DESCRIPTION: This code snippet demonstrates how to install dependencies, start a development server with hot reload, and generate a production-ready bundle for the PocketBase Superuser dashboard UI. It uses npm commands for package management and build processes.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/ui/README.md#2025-04-22_snippet_0

LANGUAGE: sh
CODE:

```
# install dependencies
npm install

# start a dev server with hot reload at localhost:3000
npm run dev

# or generate production ready bundle in dist/ directory
npm run build
```

---

TITLE: Setting up and running the PocketBase Admin UI
DESCRIPTION: Command to start the development server for the Admin UI after installing dependencies, allowing frontend changes to be immediately visible.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CONTRIBUTING.md#2025-04-22_snippet_4

LANGUAGE: sh
CODE:

```
npm run dev
```

---

TITLE: Running the PocketBase Go server during development
DESCRIPTION: Commands to navigate to the example implementation and run the PocketBase server for testing Go code changes.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CONTRIBUTING.md#2025-04-22_snippet_1

LANGUAGE: sh
CODE:

```
go run main.go serve
```

---

TITLE: Running Go linter on PocketBase codebase
DESCRIPTION: Commands to run the golangci-lint linter on the PocketBase Go code, either directly or using the Makefile shortcut.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CONTRIBUTING.md#2025-04-22_snippet_3

LANGUAGE: sh
CODE:

```
golangci-lint run -c ./golangci.yml ./...

# or using the Makefile
make lint
```

---

TITLE: Renaming Dao Functions in Go
DESCRIPTION: Renaming of two Dao functions for consistency with other Dao table related helpers.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_1

LANGUAGE: go
CODE:

```
Renamed `daos.GetTableColumns()` to `daos.TableColumns()` for consistency with the other Dao table related helpers.

Renamed `daos.GetTableInfo()` to `daos.TableInfo()` for consistency with the other Dao table related helpers.
```

---

TITLE: Pinning AWS SDK Go v2 Dependencies
DESCRIPTION: Shows how to pin specific versions of AWS SDK Go v2 dependencies in the go.mod file and clean the module cache to work around compatibility issues with non-AWS S3 providers.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG.md#_snippet_2

LANGUAGE: Go Module
CODE:

```
// go.mod
github.com/aws/aws-sdk-go-v2 v1.36.1
github.com/aws/aws-sdk-go-v2/config v1.28.10
github.com/aws/aws-sdk-go-v2/credentials v1.17.51
github.com/aws/aws-sdk-go-v2/feature/s3/manager v1.17.48
github.com/aws/aws-sdk-go-v2/service/s3 v1.72.2
```

LANGUAGE: Shell
CODE:

```
// after that run
go clean -modcache && go mod tidy
```

---

TITLE: Cloning the PocketBase repository for contribution
DESCRIPTION: Command to clone your forked PocketBase repository to your local machine for development purposes.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CONTRIBUTING.md#2025-04-22_snippet_0

LANGUAGE: bash
CODE:

```
git clone https://github.com/your_username/pocketbase.git
```

---

TITLE: Update PocketBase Go API Test Scenario for Create Rule Failure
DESCRIPTION: This Go snippet demonstrates how to modify a `tests.ApiScenario` definition in PocketBase v0.27.0 to correctly test a Create API rule failure. Due to a change in rule check timing, the `OnRecordCreateRequest` hook is no longer expected to fire in this specific failure scenario, requiring an update to the `ExpectedEvents` map.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG.md#_snippet_0

LANGUAGE: go
CODE:

```
tests.ApiScenario{
    Name:   "Example test that checks a Create API rule failure"
    Method: http.MethodPost,
    URL:    "/api/collections/example/records",
    ...
    // old:
    ExpectedEvents:  map[string]int{
        "*":                     0,
        "OnRecordCreateRequest": 1,
    },
    // new:
    ExpectedEvents:  map[string]int{"*": 0},
}
```

---

TITLE: Initialize Prism Syntax Highlighter (JavaScript)
DESCRIPTION: Initializes the global Prism object, ensuring it exists, and sets the 'manual' property to true. This prevents automatic highlighting and requires manual triggering of the highlighting process.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/ui/index.html#_snippet_0

LANGUAGE: JavaScript
CODE:

```
window.Prism = window.Prism || {}; window.Prism.manual = true;
```

---

TITLE: Configuring Prism for Manual Initialization (JavaScript)
DESCRIPTION: This JavaScript snippet initializes the global `window.Prism` object if it doesn't already exist and sets its `manual` property to `true`. Setting `manual` to `true` prevents Prism from automatically highlighting code blocks on page load, allowing for programmatic control over when and how highlighting occurs.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/ui/dist/index.html#_snippet_0

LANGUAGE: javascript
CODE:

```
window.Prism = window.Prism || {}; window.Prism.manual = true;
```

---

TITLE: Deprecated Components in PocketBase v0.9+
DESCRIPTION: The list of components that are marked as deprecated and will be removed in PocketBase v0.9+. This includes EmailAuth settings, EmailAuthConfig, user-specific field types and options.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_19

LANGUAGE: go
CODE:

```
core.Settings.EmailAuth{}
core.EmailAuthConfig{}
schema.FieldTypeUser
schema.UserOptions{}
```

---

TITLE: Version Update Log Entry Example
DESCRIPTION: Example of how version changes are documented in the changelog, showing the format used to document backported changes, improvements, and fixes.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_0

LANGUAGE: markdown
CODE:

```
## v0.22.34

- (_Backported from v0.26.6_) Allow OIDC `email_verified` to be int or boolean string since some OIDC providers like AWS Cognito has non-standard userinfo response ([#6657](https://github.com/pocketbase/pocketbase/pull/6657)).
```

---

TITLE: Querying Records with Excerpt Field Modifier in JavaScript
DESCRIPTION: Demonstrates how to use the new ':excerpt' field modifier when querying records. This modifier returns a short plain text version of any string value, which can be used to minimize downloaded JSON data for large text fields.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_6

LANGUAGE: javascript
CODE:

```
await pb.collection("example").getList(1, 20, {
  "fields": "*,description:excerpt(100)"
})
```

---

TITLE: JavaScript Code Example
DESCRIPTION: Example of JavaScript code migration showing the transition from String.fromCharCode to toString helper function for handling multi-byte characters.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_1

LANGUAGE: javascript
CODE:

```
decodeURIComponent(escape(String.fromCharCode(...bytes))) -> toString(bytes)
```

---

TITLE: Adding Event Hooks in Go
DESCRIPTION: Lists new event hooks added to PocketBase for various operations including bootstrap, API errors, realtime connections, and user authentication flows.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_11

LANGUAGE: go
CODE:

```
app.OnBeforeBootstrap()
app.OnAfterBootstrap()
app.OnBeforeApiError()
app.OnAfterApiError()
app.OnRealtimeDisconnectRequest()
app.OnRealtimeBeforeMessageSend()
app.OnRealtimeAfterMessageSend()
app.OnRecordBeforeRequestPasswordResetRequest()
app.OnRecordAfterRequestPasswordResetRequest()
app.OnRecordBeforeConfirmPasswordResetRequest()
app.OnRecordAfterConfirmPasswordResetRequest()
app.OnRecordBeforeRequestVerificationRequest()
app.OnRecordAfterRequestVerificationRequest()
app.OnRecordBeforeConfirmVerificationRequest()
app.OnRecordAfterConfirmVerificationRequest()
app.OnRecordBeforeRequestEmailChangeRequest()
app.OnRecordAfterRequestEmailChangeRequest()
app.OnRecordBeforeConfirmEmailChangeRequest()
app.OnRecordAfterConfirmEmailChangeRequest()
```

---

TITLE: Using JSVM Security Helpers (JavaScript)
DESCRIPTION: Example of using the new JSVM helper crypto primitives under the $security namespace.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_16_22.md#2025-04-22_snippet_11

LANGUAGE: javascript
CODE:

```
$security.md5(text)
$security.sha256(text)
$security.sha512(text)
```

---

TITLE: Using Record Helper Functions in Go
DESCRIPTION: Code sample showing the new auth collection Record helper methods that replace previous User-related functionality. These methods manage username, email, verification, tokens, and password handling.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG_8_15.md#2025-04-22_snippet_17

LANGUAGE: go
CODE:

```
func (m *Record) Username() string
func (m *Record) SetUsername(username string) error
func (m *Record) Email() string
func (m *Record) SetEmail(email string) error
func (m *Record) EmailVisibility() bool
func (m *Record) SetEmailVisibility(visible bool) error
func (m *Record) IgnoreEmailVisibility(state bool)
func (m *Record) Verified() bool
func (m *Record) SetVerified(verified bool) error
func (m *Record) TokenKey() string
func (m *Record) SetTokenKey(key string) error
func (m *Record) RefreshTokenKey() error
func (m *Record) LastResetSentAt() types.DateTime
func (m *Record) SetLastResetSentAt(dateTime types.DateTime) error
func (m *Record) LastVerificationSentAt() types.DateTime
func (m *Record) SetLastVerificationSentAt(dateTime types.DateTime) error
func (m *Record) ValidatePassword(password string) bool
func (m *Record) SetPassword(password string) error
```

---

TITLE: Running Go tests for PocketBase
DESCRIPTION: Commands to run the Go tests in the PocketBase project, including using the standard test command or the Makefile shortcut.
SOURCE: https://github.com/pocketbase/pocketbase/blob/master/CONTRIBUTING.md#2025-04-22_snippet_2

LANGUAGE: sh
CODE:

```
go test ./...

# or using the Makefile
make test
```
