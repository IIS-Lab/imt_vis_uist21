openssl genrsa -out server.key 2048                                                                                     
openssl req -new -x509 -sha256 -key server.key -out server.cer -days 365 -subj /CN=$1  
