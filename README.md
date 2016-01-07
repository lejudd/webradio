# WebRadio

Browser radio interface to Hamlib rigctl

Simple browser interface to control radio receivers

## Requirements

- hamlib
- nodejs
	- express
	- http
	- socket.io

## Running

Run rigctld connecting it to an appropriate radio. 
eg.
	rigctld -m <radioid> -r <serial-port> -s <serial-speed>
	
Start the webserver.
	node server.js

Connect to the interface at:
	http://localhost:3000


## Running with apache

By default, node serves the content and websocket on port 3000 
To use apache to serve the content:

- requires apache 2.4
- a2enmod proxy
- a2enmod proxy_wstunnel
- a2enmod rewrite

The following needs to be added to appache site configuration:

	RewriteEngine On
	RewriteCond %{REQUEST_URI}      ^/socket.io             [NC]
	RewriteCond %{QUERY_STRING}     transport=websocket     [NC]
	RewriteRule /(.*)               ws://localhost:3000/$1  [P,L]

	ProxyPass /socket.io http://localhost:3000/socket.io
	ProxyPassReverse /socket.io http://localhost:3000/socket.io


