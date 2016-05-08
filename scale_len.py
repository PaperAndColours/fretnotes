import math

def calc(x, sl):
	return sl - (sl / math.pow(2, x/12.0))

sl = 1000
s_max = 12*4

for i in range(1, s_max):
	val = calc(i, sl)
	i_val =  sl/val
	print i, i_val, val, i_val/val


"""
solve for sl

sl - (sl / 2^(frets/12.0)) = width

- (sl / 2^(frets/12.0)) = width - sl

sl / 2^(frets/12.0) = sl - width

sl = (sl - width) * 2^(frets/12)

sl = sl*2^(frets/12) - width * 2^(frets/12)

sl - sl*(frets/12)*log(2) = - width * 2^(frets/12)

x - y*z = 1



sl/2^(frets/12) - sl = - width 


8 / 2 = 8 - 4

8 = (8 - 4) * 2

8 = 8*2 - 4*2

8 - 8*2 = - 4*2



sl / 2^(frets/12.0) + width = sl 

sl * 1/ 2^(frets/12.0) + width = sl 

1/ 2^(frets/12.0) + width = 1


8 - (8 / 2) = 4
- (8/2) = 4 - 8
(8/2) = 8 - 4

(8/2) + 4 = 8

8 * 1/2 + 4 = 8

1/2 + 4/8 = 8/8

"""
