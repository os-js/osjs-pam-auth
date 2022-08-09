<p align="center">
  <img alt="OS.js Logo" src="https://raw.githubusercontent.com/os-js/gfx/master/logo-big.png" />
</p>

[OS.js](https://www.os-js.org/) is an [open-source](https://raw.githubusercontent.com/os-js/OS.js/master/LICENSE) web desktop platform with a window manager, application APIs, GUI toolkit, filesystem abstractions and much more.

[![Support](https://img.shields.io/badge/patreon-support-orange.svg)](https://www.patreon.com/user?u=2978551&ty=h&u=2978551)
[![Support](https://img.shields.io/badge/opencollective-donate-red.svg)](https://opencollective.com/osjs)
[![Donate](https://img.shields.io/badge/liberapay-donate-yellowgreen.svg)](https://liberapay.com/os-js/)
[![Donate](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://paypal.me/andersevenrud)
[![Community](https://img.shields.io/badge/join-community-green.svg)](https://community.os-js.org/)

# OS.js v3 PAM Auth Provider Adapter

This is the PAM Auth Provider Adapter for OS.js v3

Please see the [OS.js Authentication Guide](https://manual.os-js.org/guide/auth/) for general information.

## Installation

```
npm install --save --production @osjs/pam-auth
```

**Please note that you need the PAM development libraries installed on your host computer.** If you don't have this, you'll get errors during npm installation.

This varies depending on your distro:

* Ubuntu: `sudo apt install libpam-dev`

## Usage

### Configure Server

In your server bootstrap script (`src/server/index.js`):

```javascript
// In the top of the file load the library
const pamAuth = require('@osjs/pam-auth');

// Locate this line in the file and add the following:
osjs.register(AuthServiceProvider, {
  args: {
    adapter: pamAuth
  }
});
```

If you want to change the home directories of users, change your configuration (`src/server/config.js`):

```javascript
{
  vfs: {
    root: '/home'
  }
}
```

*A restart of the server is required*

### Configure Client

In your client configuration file (`src/client/config.js`) file remove the automatic login:

```javascript
module.exports = {
  public: '/',

  // Either comment out this section, or remove it entirely
  /*
  auth: {
    login: {
      username: 'demo',
      password: 'demo'
    }
  }
  */
};
```

*Rebuilding the client is required*

## Custom groups

By default, groups are read from `/etc/group`, but you can customize this:

```javascript
osjs.register(AuthServiceProvider, {
  args: {
    adapter: pamAuth,
    config: {
      native: false,
      config: '/etc/osjs/groups.json' // Default
    }
  }
});
```

The format of this file is:

```json
{
  "username": ["group1", "group2"]
}
```

## Using IPC

You can also connect this adapter up to a IPC running as a separate user if you can't use PAM as the user OS.js server runs on.

```javascript
osjs.register(AuthServiceProvider, {
  args: {
    adapter: pamAuth,
    config: {
      ipc: true
    }
  }
});
```

And then run the `src/ipc.js` server as the required user.

## Contribution

* **Sponsor on [Github](https://github.com/sponsors/andersevenrud)**
* **Become a [Patreon](https://www.patreon.com/user?u=2978551&ty=h&u=2978551)**
* **Support on [Open Collective](https://opencollective.com/osjs)**
* [Contribution Guide](https://github.com/os-js/OS.js/blob/master/CONTRIBUTING.md)

## Documentation

See the [Official Manuals](https://manual.os-js.org/) for articles, tutorials and guides.

## Links

* [Official Chat](https://gitter.im/os-js/OS.js)
* [Community Forums and Announcements](https://community.os-js.org/)
* [Homepage](https://os-js.org/)
* [Twitter](https://twitter.com/osjsorg) ([author](https://twitter.com/andersevenrud))
* [Google+](https://plus.google.com/b/113399210633478618934/113399210633478618934)
* [Facebook](https://www.facebook.com/os.js.org)
* [Docker Hub](https://hub.docker.com/u/osjs/)
